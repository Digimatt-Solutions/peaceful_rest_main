-- 1. Anniversary reminder delivery tracking (prevents duplicate sends)
ALTER TABLE public.anniversary_reminders
  ADD COLUMN IF NOT EXISTS last_notified_on date;

-- 2. Financial audit trail for donations, payouts and fundraisers
CREATE OR REPLACE FUNCTION public.log_financial_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old jsonb;
  _action text;
  _desc text;
  _id text;
BEGIN
  IF TG_OP <> 'INSERT' THEN _old := to_jsonb(OLD); END IF;

  IF TG_TABLE_NAME = 'donations' THEN
    _id := NEW.id::text;
    IF TG_OP = 'INSERT' THEN
      _action := 'donation_recorded';
      _desc := 'Donation of ' || NEW.amount || ' recorded (' || COALESCE(NEW.status, 'pending') || ')';
    ELSE
      _action := 'donation_updated';
      _desc := 'Donation status ' || COALESCE(OLD.status, '-') || ' to ' || COALESCE(NEW.status, '-');
    END IF;
  ELSIF TG_TABLE_NAME = 'payouts' THEN
    _id := NEW.id::text;
    _action := CASE WHEN TG_OP = 'INSERT' THEN 'payout_requested' ELSE 'payout_updated' END;
    _desc := 'Payout of ' || NEW.amount || ' to ' || NEW.phone || ' (' || NEW.status || ')';
  ELSE
    _id := NEW.id::text;
    _action := CASE WHEN TG_OP = 'INSERT' THEN 'fundraiser_created' ELSE 'fundraiser_financials_changed' END;
    _desc := 'Fundraiser "' || NEW.title || '" status ' || NEW.status
             || ', raised ' || NEW.raised_amount || ', paid out ' || NEW.paid_out_amount;
  END IF;

  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, description, metadata)
  VALUES (auth.uid(), _action, TG_TABLE_NAME, _id, _desc,
          jsonb_build_object('op', TG_OP, 'old', _old, 'new', to_jsonb(NEW)));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_donations ON public.donations;
CREATE TRIGGER audit_donations
AFTER INSERT OR UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.log_financial_event();

DROP TRIGGER IF EXISTS audit_payouts ON public.payouts;
CREATE TRIGGER audit_payouts
AFTER INSERT OR UPDATE ON public.payouts
FOR EACH ROW EXECUTE FUNCTION public.log_financial_event();

DROP TRIGGER IF EXISTS audit_fundraiser_financials ON public.fundraisers;
CREATE TRIGGER audit_fundraiser_financials
AFTER INSERT OR UPDATE OF raised_amount, paid_out_amount, status, approved_by ON public.fundraisers
FOR EACH ROW EXECUTE FUNCTION public.log_financial_event();

-- 3. Block unauthorised changes to fundraiser money and approval fields
CREATE OR REPLACE FUNCTION public.guard_fundraiser_financials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;          -- trusted server-side context
  IF public.has_role(auth.uid(), 'super_admin') THEN RETURN NEW; END IF;

  IF NEW.raised_amount IS DISTINCT FROM OLD.raised_amount
     OR NEW.paid_out_amount IS DISTINCT FROM OLD.paid_out_amount
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'Only an administrator can change fundraiser amounts or approval status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_fundraiser_money ON public.fundraisers;
CREATE TRIGGER guard_fundraiser_money
BEFORE UPDATE ON public.fundraisers
FOR EACH ROW EXECUTE FUNCTION public.guard_fundraiser_financials();

-- 4. Validation: donations and payouts must be positive amounts
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_amount_positive;
ALTER TABLE public.donations ADD CONSTRAINT donations_amount_positive CHECK (amount > 0) NOT VALID;
ALTER TABLE public.payouts DROP CONSTRAINT IF EXISTS payouts_amount_positive;
ALTER TABLE public.payouts ADD CONSTRAINT payouts_amount_positive CHECK (amount > 0) NOT VALID;

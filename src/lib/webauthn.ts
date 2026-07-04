import { startRegistration, startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";

export const isWebAuthnSupported = () => browserSupportsWebAuthn();

export const registerFingerprint = async (deviceName?: string) => {
  const { data: opts, error } = await supabase.functions.invoke("webauthn-register-options");
  if (error) throw new Error(error.message);
  const attestationResponse = await startRegistration(opts.options);
  const { data: verify, error: vErr } = await supabase.functions.invoke("webauthn-register-verify", {
    body: { attestationResponse, deviceName: deviceName || navigator.userAgent.split(") ")[0].split(" (")[1] || "This device" },
  });
  if (vErr) throw new Error(vErr.message);
  if (!verify?.verified) throw new Error("Registration failed");
  return true;
};

export const signInWithFingerprint = async (email: string) => {
  const { data: opts, error } = await supabase.functions.invoke("webauthn-login-options", { body: { email } });
  if (error) throw new Error(error.message);
  const assertionResponse = await startAuthentication(opts.options);
  const { data: verify, error: vErr } = await supabase.functions.invoke("webauthn-login-verify", {
    body: { email, assertionResponse },
  });
  if (vErr) throw new Error(vErr.message);
  if (!verify?.verified || !verify?.hashed_token) throw new Error("Verification failed");
  const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: verify.hashed_token, type: "magiclink" });
  if (otpErr) throw new Error(otpErr.message);
  return true;
};

export const listFingerprints = async (userId: string) => {
  const { data, error } = await supabase.from("webauthn_credentials").select("id, device_name, created_at, last_used_at").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

export const removeFingerprint = async (id: string) => {
  const { error } = await supabase.from("webauthn_credentials").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

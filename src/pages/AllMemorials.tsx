import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  ArrowUpRight,
  CalendarDays,
  Eye,
  Flame,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackVisit } from "@/lib/trackVisit";

type Memorial = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  location: string | null;
  short_tribute: string | null;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
  visitor_count: number | null;
};

const PAGE_SIZE = 12;

const formatDate = (d: string | null) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const computeAge = (dob: string | null, dod: string | null) => {
  if (!dob || !dod) return null;
  const birth = new Date(dob);
  const death = new Date(dod);
  let age = death.getFullYear() - birth.getFullYear();
  const m = death.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && death.getDate() < birth.getDate())) age--;
  return age;
};

const AllMemorials = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [condCounts, setCondCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    document.title = "All Memorials | Makiwa";
    const desc =
      "Browse every memorial page on Makiwa. Honor loved ones, read tributes and share cherished memories.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
    trackVisit("/memorials");
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("memorials")
      .select(
        "id,full_name,date_of_birth,date_of_death,location,short_tribute,cover_photo_url,profile_photo_url,visitor_count",
        { count: "exact" }
      )
      .eq("is_public", true);

    if (search.trim()) {
      const q = search.trim();
      query = query.or(
        `full_name.ilike.%${q}%,location.ilike.%${q}%,short_tribute.ilike.%${q}%`
      );
    }

    query
      .order("created_at", { ascending: false })
      .range(from, to)
      .then(async ({ data, count }) => {
        const rows = (data as Memorial[]) || [];
        setMemorials(rows);
        setTotalCount(count || 0);
        setLoading(false);

        const ids = rows.map((r) => r.id);
        if (ids.length) {
          const { data: cs } = await supabase
            .from("condolences")
            .select("memorial_id")
            .in("memorial_id", ids);
          const tally: Record<string, number> = {};
          (cs || []).forEach((c: any) => {
            tally[c.memorial_id] = (tally[c.memorial_id] || 0) + 1;
          });
          setCondCounts(tally);
        }
      });
  }, [page, search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount]
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push("ellipsis", totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1, "ellipsis");
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages);
    }
    return pages;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shareMemorial = async (e: React.MouseEvent, m: Memorial) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/memorial/${m.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `In memory of ${m.full_name}`,
          text: m.short_tribute || "Visit this memorial on Makiwa",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Memorial link copied");
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <section className="bg-[#faf8f5] pt-28 sm:pt-32 pb-16 sm:pb-20">
        <div className="container-luxe">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange">
            <Flame className="h-3.5 w-3.5" />
            In Loving Memory
          </span>

          <h1 className="mt-4 font-serif text-4xl lg:text-5xl font-medium leading-tight text-black">
            All Memorials
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Every memorial created on Makiwa. Search by name, place or tribute and
            open a page to read the full story.
          </p>

          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, location or tribute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-10 pr-10 rounded-xl border-black/10 bg-white shadow-sm focus-visible:border-brand-orange focus-visible:ring-brand-orange/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-brand-orange hover:bg-brand-orange/10 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!loading && (
            <p className="mt-4 text-sm text-muted-foreground">
              {totalCount} memorial{totalCount === 1 ? "" : "s"} found
            </p>
          )}
        </div>
      </section>

      <section className="pb-20 sm:pb-24 bg-[#faf8f5]">
        <div className="container-luxe">
          {loading ? (
            <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-black/5 bg-white"
                >
                  <div className="h-72 bg-muted animate-pulse" />
                  <div className="p-6 space-y-4">
                    <div className="h-5 w-2/3 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                    <div className="h-16 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : memorials.length === 0 ? (
            <div className="rounded-3xl bg-white border border-black/5 p-12 text-center shadow-sm">
              <div className="h-16 w-16 mx-auto rounded-full bg-brand-orange/10 flex items-center justify-center mb-6">
                <Flame className="h-7 w-7 text-brand-orange" />
              </div>
              <h2 className="font-serif text-3xl text-black">
                No Memorials Found
              </h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                Try a different search, or create a memorial to honor a loved one.
              </p>
              <Button
                asChild
                className="mt-8 bg-brand-orange hover:bg-brand-orange/90 text-white h-12 px-8 rounded-xl"
              >
                <Link to="/auth">Create A Memorial</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
                {memorials.map((m) => {
                  const photo = m.profile_photo_url || m.cover_photo_url;
                  const ageAtDeath = computeAge(m.date_of_birth, m.date_of_death);

                  return (
                    <Link key={m.id} to={`/memorial/${m.id}`} className="group block">
                      <article className="overflow-hidden rounded-[16px] bg-white border border-black/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]">
                        <div className="relative h-[320px] sm:h-[355px] overflow-hidden">
                          {photo ? (
                            <img
                              src={photo}
                              alt={`Memorial photo of ${m.full_name}`}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-orange to-brand-orange/80">
                              <span className="font-serif text-7xl text-white">
                                {m.full_name.charAt(0)}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <h2 className="font-serif text-[30px] sm:text-[34px] leading-none font-medium">
                              {m.full_name}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/90">
                              <CalendarDays className="h-4 w-4" />
                              <span>{formatDate(m.date_of_birth)}</span>
                              <span>-</span>
                              <span>{formatDate(m.date_of_death)}</span>
                              {ageAtDeath !== null && (
                                <span className="text-white/75">(age {ageAtDeath})</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-5">
                          {m.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <MapPin className="h-4 w-4 text-brand-orange" />
                              <span>{m.location}</span>
                            </div>
                          )}

                          <div className="h-px bg-black/8" />

                          <div className="flex gap-3">
                            <div className="pt-1">
                              <span className="font-serif text-3xl text-brand-orange leading-none">
                                “
                              </span>
                            </div>
                            <p className="italic text-[14px] leading-5 line-clamp-2 overflow-hidden text-foreground">
                              {m.short_tribute ||
                                "A life remembered with love, gratitude and cherished memories."}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-neutral-200/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4 text-xs text-neutral-600">
                              <span className="inline-flex items-center gap-1.5" title="Condolences">
                                <MessageCircle className="h-4 w-4 stroke-[2] text-brand-orange" />
                                <span className="font-medium">{condCounts[m.id] || 0}</span>
                              </span>

                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] border border-neutral-200 bg-neutral-50/50"
                                title="Views"
                              >
                                <Eye className="h-4 w-4 stroke-[2] text-brand-orange" />
                                <span className="font-medium">
                                  {(m.visitor_count || 0).toLocaleString()}
                                </span>
                              </span>

                              <button
                                type="button"
                                onClick={(e) => shareMemorial(e, m)}
                                className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-brand-orange transition-colors"
                                aria-label="Share memorial"
                              >
                                <Share2 className="h-4 w-4 stroke-[2]" />
                              </button>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-[8px] px-3.5 py-2 border-2 border-brand-orange bg-brand-orange text-white font-bold text-sm shadow-sm transition-all duration-300 group-hover:bg-white group-hover:text-brand-orange">
                              <span>View Memorial</span>
                              <ArrowUpRight className="h-4 w-4 stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-14 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(page - 1);
                          }}
                          className={cn(page === 1 && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>

                      {pageNumbers.map((p, idx) =>
                        p === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <button
                              onClick={() => goToPage(p)}
                              className={cn(
                                buttonVariants({
                                  variant: p === page ? "default" : "outline",
                                  size: "icon",
                                }),
                                "h-9 w-9 text-sm font-medium"
                              )}
                              aria-current={p === page ? "page" : undefined}
                            >
                              {p}
                            </button>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(page + 1);
                          }}
                          className={cn(
                            page === totalPages && "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default AllMemorials;

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
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
  MapPin,
  Flame,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Memorial = {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  date_of_death: string | null;
  location: string | null;
  short_tribute: string | null;
  cover_photo_url: string | null;
  profile_photo_url: string | null;
};

const PAGE_SIZE = 3;

const formatDate = (d: string | null) => {
  if (!d) return "—";
  const date = new Date(d);

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const Memorials = () => {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    supabase
      .from("memorials")
      .select(
        "id,full_name,date_of_birth,date_of_death,location,short_tribute,cover_photo_url,profile_photo_url",
        { count: "exact" }
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(from, to)
      .then(({ data, count }) => {
        setMemorials((data as Memorial[]) || []);
        setTotalCount(count || 0);
        setLoading(false);
      });
  }, [page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount]
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return;
    setPage(p);
    const section = document.getElementById("memorials");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="memorials"
      className="py-20 sm:py-24 lg:py-32 bg-[#faf8f5]"
    >
      <div className="container-luxe">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">

          <div className="max-w-3xl">

            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-orange">
              <Flame className="h-3.5 w-3.5" />
              In Loving Memory
            </span>

            <h2 className="mt-4 font-serif text-4xl lg:text-5xl font-medium leading-tight text-black">
              Recently Shared Memorials
            </h2>

            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Discover memorial pages created by families and communities to
              celebrate, honor and preserve the stories of loved ones.
            </p>

          </div>

          <Button
            asChild
            variant="outline"
            className="h-12 px-6 rounded-xl border-black/10 bg-white hover:bg-black hover:text-white"
          >
            <Link to="/auth">
              View All Memorials
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
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

            <h3 className="font-serif text-3xl text-black">
              A Space Ready To Be Filled With Memory
            </h3>

            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Be among the first to create a memorial on Makiwa. Honor a life,
              gather loved ones and preserve cherished memories for generations.
            </p>

            <Button
              asChild
              className="mt-8 bg-brand-orange hover:bg-brand-orange/90 text-white h-12 px-8 rounded-xl"
            >
              <Link to="/auth">
                Create The First Memorial
              </Link>
            </Button>

          </div>

        ) : (

          <>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {memorials.map((m) => {
                const photo = m.profile_photo_url || m.cover_photo_url;

                return (
                  <Link
                    key={m.id}
                    to={`/memorial/${m.id}`}
                    className="group block"
                  >
                    <article className="overflow-hidden rounded-[24px] bg-white border border-black/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.10)]">

                      {/* Image */}
                      <div className="relative h-[355px] overflow-hidden">

                        {photo ? (
                          <img
                            src={photo}
                            alt={m.full_name}
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

                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                        {/* Name Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">

                          <h3 className="font-serif text-[34px] leading-none font-medium">
                            {m.full_name}
                          </h3>

                          <div className="mt-4 flex items-center gap-2 text-sm text-white/90">
                            <CalendarDays className="h-4 w-4" />
                            <span>
                              {formatDate(m.date_of_birth)}
                            </span>

                            <span>—</span>

                            <span>
                              {formatDate(m.date_of_death)}
                            </span>
                          </div>

                        </div>

                      </div>

                      {/* Content */}
                      <div className="p-7">

                        {m.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
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

                          <p className="italic text-[16px] leading-7 text-neutral-600 line-clamp-2 min-h-[3.5rem] overflow-hidden text-ellipsis">
                            {m.short_tribute ||
                              "A life remembered with love, gratitude and cherished memories."}
                          </p>

                        </div>

                        <div className="mt-2 flex items-center justify-between">

                          <div className="flex items-center gap-2 border-2 rounded-lg p-2 border-brand-orange/50 hover:bg-brand-orange font-medium text-md">

                            <span>View Memorial</span>

                            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />

                          </div>

                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#faf7f3] border border-black/5">

                            <Flame className="h-5 w-5 text-brand-orange" />

                          </div>

                        </div>

                      </div>

                    </article>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
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
                        className={cn(
                          page === 1 && "pointer-events-none opacity-50"
                        )}
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
  );
};

import type {
  CollectionResponse,
  FilterOptions,
  Program,
  ProgramsParams,
  DeltaHub,
} from "../types";

type ProgramsApiDeps = {
  programsPerPage: number;
  wpApi: string;
  buildUrl: (
    base: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ) => string;
  tryFetch: <T>(url: string, timeoutMs?: number) => Promise<T | null>;
  tryFetchWithHeaders: (
    url: string,
    timeoutMs?: number
  ) => Promise<{ data: unknown; headers: Headers } | null>;
  normalizeWpProgram: (
    program: Record<string, unknown>,
    options: { hubs: DeltaHub[] }
  ) => Program;
  mockHubs: DeltaHub[];
};

async function fetchTaxonomy(
  taxonomy: string,
  deps: Pick<ProgramsApiDeps, "buildUrl" | "tryFetch" | "wpApi">
): Promise<{ label: string; value: string }[]> {
  const res = await deps.tryFetch<Record<string, unknown>[]>(
    deps.buildUrl(deps.wpApi, `/${taxonomy}`, { per_page: 100, hide_empty: true })
  );
  if (!Array.isArray(res)) return [];

  return res.map((term) => ({
    label: term.name as string,
    value: String(term.id),
  }));
}

let programFiltersPromise: Promise<FilterOptions | undefined> | null = null;

export async function getProgramFiltersApi(
  deps: Pick<ProgramsApiDeps, "buildUrl" | "tryFetch" | "wpApi">
): Promise<FilterOptions | undefined> {
  if (!programFiltersPromise) {
    programFiltersPromise = (async () => {
      const [levelOpts, categoryOpts, universityOpts, modeOpts, cityOpts, uniTypeOpts] =
        await Promise.all([
          fetchTaxonomy("program_level", deps),
          fetchTaxonomy("program_category", deps),
          fetchTaxonomy("program_university", deps),
          fetchTaxonomy("program_mode", deps),
          fetchTaxonomy("program_city", deps),
          fetchTaxonomy("uni_type", deps),
        ]);

      if (
        !levelOpts.length &&
        !categoryOpts.length &&
        !universityOpts.length &&
        !modeOpts.length &&
        !cityOpts.length &&
        !uniTypeOpts.length
      ) {
        return undefined;
      }

      return {
        level: levelOpts,
        category: categoryOpts,
        university: universityOpts,
        mode: modeOpts,
        city: cityOpts,
        uni_type: uniTypeOpts,
      };
    })().catch(() => undefined);
  }

  return programFiltersPromise;
}

export async function getProgramsApi(
  params: ProgramsParams = {},
  deps: ProgramsApiDeps
): Promise<{
  data: Program[];
  meta: CollectionResponse<Program>["meta"];
  filters?: FilterOptions;
  isMock: boolean;
  sourceUnavailable: boolean;
}> {
  try {
    const programsTimeoutMs = 15000;
    const url = deps.buildUrl(deps.wpApi, "/program", {
      page: params.page || 1,
      per_page: deps.programsPerPage,
      _embed: 1,
      search: params.q || undefined,
      program_level: params.level || undefined,
      program_category: params.category || undefined,
      program_university: params.university || undefined,
      program_mode: params.mode || undefined,
      program_city: params.city || undefined,
      uni_type: params.uni_type || undefined,
    });

    const result = await deps.tryFetchWithHeaders(url, programsTimeoutMs);
    if (result && Array.isArray(result.data)) {
      const total = parseInt(result.headers.get("X-WP-Total") || "0", 10);
      const totalPages = parseInt(result.headers.get("X-WP-TotalPages") || "1", 10);
      const programs = (result.data as Record<string, unknown>[]).map((program) =>
        deps.normalizeWpProgram(program, { hubs: deps.mockHubs })
      );

      return {
        data: programs,
        meta: {
          page: params.page || 1,
          perPage: deps.programsPerPage,
          total: total || programs.length,
          totalPages: totalPages || 1,
        },
        isMock: false,
        sourceUnavailable: false,
      };
    }
  } catch {
    // Continue to unavailable fallback
  }

  const page = params.page || 1;
  return {
    data: [],
    meta: { page, perPage: deps.programsPerPage, total: 0, totalPages: 1 },
    filters: undefined,
    isMock: false,
    sourceUnavailable: true,
  };
}

export async function getProgramApi(
  slug: string,
  deps: ProgramsApiDeps
): Promise<{ data: Program | null; isMock: boolean; sourceUnavailable: boolean }> {
  try {
    const programsTimeoutMs = 15000;
    const url = deps.buildUrl(deps.wpApi, "/program", { slug, _embed: 1 });
    const result = await deps.tryFetch<Record<string, unknown>[]>(url, programsTimeoutMs);

    if (Array.isArray(result) && result.length > 0) {
      return {
        data: deps.normalizeWpProgram(result[0], { hubs: deps.mockHubs }),
        isMock: false,
        sourceUnavailable: false,
      };
    }
  } catch {
    // Continue to unavailable fallback
  }

  return { data: null, isMock: false, sourceUnavailable: true };
}

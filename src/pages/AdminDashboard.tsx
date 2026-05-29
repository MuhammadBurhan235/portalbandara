import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  Star,
  Users,
} from "lucide-react";
import { apiClient } from "../api/axios";

type CategoryStat = {
  kategori_layanan: string;
  total: number;
};

type TrendStat = {
  date: string;
  total_feedbacks: number;
  average_rating: number | null;
};

type RecentComment = {
  id: number;
  lokasi_scan: string;
  rating: number;
  kategori_layanan: string | null;
  komentar: string;
  created_at: string;
};

type LocationStat = {
  lokasi_scan: string;
  total: number;
};

type AppliedFilters = {
  location: string | null;
  range: RangeOption;
};

type RangeOption = "today" | "7d" | "30d" | "90d" | "all";

const categoryDescriptions: Record<string, string> = {
  "Informasi & Prosedur":
    "Kejelasan alur, papan informasi, dan prosedur layanan.",
  "Sarana Prasarana":
    "Kualitas fasilitas, kebersihan, dan kenyamanan area bandara.",
  "Sikap Petugas": "Keramahan, empati, dan profesionalitas petugas layanan.",
  "Waktu & Biaya": "Kecepatan proses dan persepsi efisiensi biaya layanan.",
  Lainnya: "Masukan tambahan di luar unsur layanan utama.",
};

type DashboardStats = {
  average_rating: number;
  total_feedbacks: number;
  categories: CategoryStat[];
  trends: TrendStat[];
  recent_comments: RecentComment[];
  locations: LocationStat[];
  filters: AppliedFilters;
};

type StatsResponse = {
  success: boolean;
  data: DashboardStats;
};

const ratingFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const rangeOptions: Array<{ label: string; value: RangeOption }> = [
  { label: "Hari ini", value: "today" },
  { label: "7 hari", value: "7d" },
  { label: "30 hari", value: "30d" },
  { label: "90 hari", value: "90d" },
  { label: "Semua data", value: "all" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedRange, setSelectedRange] = useState<RangeOption>("7d");

  useEffect(() => {
    void fetchStats();
  }, [selectedLocation, selectedRange]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await apiClient.get<StatsResponse>("/feedback/stats", {
        params: {
          range: selectedRange,
          ...(selectedLocation !== "all" ? { location: selectedLocation } : {}),
        },
      });
      setStats(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data statistik:", error);
      setErrorMessage(
        "Data dashboard belum dapat dimuat. Coba segarkan halaman.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const exportUrl = apiClient.getUri({
      url: "/feedback/export",
      params: {
        range: selectedRange,
        ...(selectedLocation !== "all" ? { location: selectedLocation } : {}),
      },
    });

    window.open(exportUrl, "_blank", "noopener,noreferrer");
  };

  const topCategory = stats?.categories?.[0]?.kategori_layanan ?? "-";
  const topCategoryDescription = stats?.categories?.length
    ? categoryDescriptions[topCategory] ||
      "Masukan dengan perhatian tertinggi dari penumpang."
    : "Belum ada data kategori yang dominan.";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-bold">
        Memuat Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Dashboard */}
        <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:items-center">
          <LayoutDashboard className="h-7 w-7 shrink-0 text-blue-600 sm:h-8 sm:w-8" />
          <h1 className="text-2xl font-bold leading-tight text-gray-800 sm:text-3xl">
            Dashboard Manajemen Bandara
          </h1>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-[1.2fr_1fr_auto] sm:items-end sm:p-6">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPinned className="h-4 w-4 text-blue-600" />
              Filter lokasi
            </label>
            <select
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="cursor-pointer w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Semua lokasi</option>
              {stats?.locations.map((location) => (
                <option key={location.lokasi_scan} value={location.lokasi_scan}>
                  {location.lokasi_scan} ({location.total})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              Rentang waktu
            </label>
            <select
              value={selectedRange}
              onChange={(event) =>
                setSelectedRange(event.target.value as RangeOption)
              }
              className="cursor-pointer w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 sm:items-stretch">
            <Link
              to="/admin/excel-to-pdf"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-100"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel ke PDF
            </Link>

            <button
              type="button"
              onClick={handleExport}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Kartu Ringkasan (Summary Cards) */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600 sm:p-4">
              <Users className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-medium">
                Total Penumpang Feedback
              </p>
              <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                {stats?.total_feedbacks || 0}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="rounded-xl bg-yellow-50 p-3 text-yellow-500 sm:p-4">
              <Star className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-medium">
                Rata-rata Rating
              </p>
              <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
                {ratingFormatter.format(stats?.average_rating || 0)}{" "}
                <span className="text-sm text-gray-400">/ 5.0</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="rounded-xl bg-green-50 p-3 text-green-600 sm:p-4">
              <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-medium">
                Unsur Paling Disorot
              </p>
              <h2 className="text-lg font-bold text-gray-800 wrap-break-word sm:text-xl">
                {topCategory}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">
                {topCategoryDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4 sm:mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Distribusi Unsur Layanan
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Membandingkan unsur yang paling sering disebut penumpang.
                </p>
              </div>
            </div>
            <div className="h-72 w-full sm:h-80">
              {stats?.categories?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.categories}
                    margin={{ top: 8, right: 8, left: -20, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis
                      dataKey="kategori_layanan"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: "#F3F4F6" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="#2563EB"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                  Belum ada kategori layanan yang bisa ditampilkan.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg font-bold text-gray-800">
                Tren Rating Harian
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Memantau perubahan kualitas layanan dari hari ke hari.
              </p>
            </div>
            <div className="h-72 w-full sm:h-80">
              {stats?.trends?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.trends.map((trend) => ({
                      ...trend,
                      date_label: dateFormatter.format(new Date(trend.date)),
                    }))}
                    margin={{ top: 8, right: 8, left: -20, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EB"
                    />
                    <XAxis
                      dataKey="date_label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const numericValue = Number(value ?? 0);

                        if (name === "average_rating") {
                          return [
                            ratingFormatter.format(numericValue),
                            "Rata-rata rating",
                          ];
                        }

                        return [numericValue, "Total feedback"];
                      }}
                      labelFormatter={(label) => `Tanggal: ${label}`}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="average_rating"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
                  Belum ada tren yang bisa ditampilkan untuk filter ini.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4 sm:mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Komentar Terbaru Penumpang
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Ringkasan masukan terkini berdasarkan filter aktif.
              </p>
            </div>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {stats?.filters.location ?? "Semua lokasi"} • {selectedRange}
            </div>
          </div>

          {stats?.recent_comments?.length ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {stats.recent_comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {comment.lokasi_scan}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dateFormatter.format(new Date(comment.created_at))}
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                      {comment.rating}/5
                    </span>
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-gray-700">
                    {comment.komentar}
                  </p>
                  <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {comment.kategori_layanan || "Tanpa kategori"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
              Belum ada komentar yang bisa ditampilkan untuk filter ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { LayoutDashboard, Users, Star, MessageSquare } from "lucide-react";
import { apiClient } from "../api/axios";

type CategoryStat = {
  kategori_layanan: string;
  total: number;
};

type DashboardStats = {
  average_rating: number;
  total_feedbacks: number;
  categories: CategoryStat[];
};

type StatsResponse = {
  success: boolean;
  data: DashboardStats;
};

const ratingFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    void fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setErrorMessage("");
      const response = await apiClient.get<StatsResponse>("/feedback/stats");
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

  const topCategory = stats?.categories?.length
    ? [...stats.categories].sort((a, b) => b.total - a.total)[0]
        ?.kategori_layanan
    : "-";

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
                Area Terbanyak Disorot
              </p>
              <h2 className="text-lg font-bold text-gray-800 wrap-break-word sm:text-xl">
                {topCategory}
              </h2>
            </div>
          </div>
        </div>

        {/* Grafik Kategori Layanan */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="mb-4 text-lg font-bold text-gray-800 sm:mb-6">
            Distribusi Kategori Layanan
          </h3>
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
      </div>
    </div>
  );
}

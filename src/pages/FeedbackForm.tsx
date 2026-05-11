import axios from "axios";
import { useEffect, useState } from "react";
import { Star, Wifi } from "lucide-react";
import { apiClient } from "../api/axios";

type FeedbackCategory =
  | "Kebersihan"
  | "Kecepatan Layanan"
  | "Fasilitas"
  | "Keamanan"
  | "Lainnya";

const WIFI_FALLBACK_URL =
  import.meta.env.VITE_WIFI_FALLBACK_URL?.trim() || "https://google.com";
const HOTSPOT_USERNAME = import.meta.env.VITE_HOTSPOT_USERNAME?.trim();
const HOTSPOT_PASSWORD = import.meta.env.VITE_HOTSPOT_PASSWORD?.trim();

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Gagal menyimpan feedback."
    );
  }

  return "Gagal menyimpan feedback.";
};

function FeedbackForm() {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [kategori, setKategori] = useState<FeedbackCategory | "">("");
  const [komentar, setKomentar] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lokasi, setLokasi] = useState<string>("Portal Utama");
  const [linkLogin, setLinkLogin] = useState<string>("");
  const [macAddress, setMacAddress] = useState<string>("");
  const activeRating = hoveredRating || rating;

  const listKategori: FeedbackCategory[] = [
    "Kebersihan",
    "Kecepatan Layanan",
    "Fasilitas",
    "Keamanan",
    "Lainnya",
  ];

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const lokasiDariURL = queryParams.get("loc");
    const urlLoginMikrotik = queryParams.get("link-login");
    const mac = queryParams.get("mac");

    if (lokasiDariURL) {
      setLokasi(lokasiDariURL.replace(/_/g, " "));
    }

    if (urlLoginMikrotik) {
      setLinkLogin(urlLoginMikrotik);
    }

    if (mac) {
      setMacAddress(mac);
    }
  }, []);

  const prosesKoneksiWiFi = () => {
    if (linkLogin && HOTSPOT_USERNAME && HOTSPOT_PASSWORD) {
      const urlTujuan = new URL(linkLogin, window.location.origin);
      urlTujuan.searchParams.set("username", HOTSPOT_USERNAME);
      urlTujuan.searchParams.set("password", HOTSPOT_PASSWORD);
      window.location.assign(urlTujuan.toString());
      return;
    }

    if (linkLogin) {
      window.location.assign(linkLogin);
      return;
    }

    if (import.meta.env.DEV && macAddress) {
      console.info(`MAC Address terdeteksi: ${macAddress}`);
    }

    window.location.assign(WIFI_FALLBACK_URL);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      await apiClient.post("/feedback", {
        lokasi_scan: lokasi,
        rating,
        kategori_layanan: kategori,
        komentar,
      });

      prosesKoneksiWiFi();
    } catch (error) {
      console.error(error);
      alert(`${getErrorMessage(error)} Anda tetap akan dihubungkan ke Wi-Fi.`);
      prosesKoneksiWiFi();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);

    try {
      await apiClient.post("/feedback", {
        lokasi_scan: lokasi,
        rating: 0,
        kategori_layanan: "Skipped",
        komentar: "",
      });
    } catch (error) {
      console.error(error);
      if (import.meta.env.DEV) {
        console.info(getErrorMessage(error));
      }
    } finally {
      prosesKoneksiWiFi();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6 sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-blue-600 px-6 py-7 text-center text-white sm:p-8">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-50 blur-2xl"></div>
          <Wifi className="relative z-10 mx-auto mb-3 h-10 w-10 sm:h-12 sm:w-12" />
          <h1 className="relative z-10 text-xl font-bold sm:text-2xl">
            Free Wi-Fi Airport
          </h1>
          <p className="relative z-10 mt-2 text-sm leading-relaxed text-blue-100">
            Bantu kami jadi lebih baik, nikmati Wi-Fi sepuasnya.
          </p>
        </div>

        {/* Form Section */}
        <div className="p-5 sm:p-6">
          <div className="mb-6 text-center">
            <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
              Bagaimana pengalaman Anda hari ini?
            </h2>
            <p className="text-sm text-gray-500">Lokasi aktif: {lokasi}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Bintang */}
            <div>
              <div
                className="flex flex-wrap justify-center gap-2 sm:flex-nowrap"
                onMouseLeave={() => setHoveredRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const fillPercentage = Math.max(
                    0,
                    Math.min(1, activeRating - (star - 1)),
                  );

                  return (
                    <div
                      key={star}
                      className="relative h-11 w-11 transition-transform hover:scale-125 sm:h-12 sm:w-12"
                    >
                      <Star className="h-11 w-11 text-gray-200 sm:h-12 sm:w-12" />
                      <div
                        className="absolute inset-y-0 left-0 overflow-hidden"
                        style={{ width: `${fillPercentage * 100}%` }}
                      >
                        <Star className="h-11 w-11 fill-yellow-400 text-yellow-400 drop-shadow-md sm:h-12 sm:w-12" />
                      </div>

                      <button
                        type="button"
                        aria-label={`Beri rating ${star - 0.5}`}
                        onClick={() => setRating(star - 0.5)}
                        onMouseEnter={() => setHoveredRating(star - 0.5)}
                        className="absolute inset-y-0 left-0 w-1/2 cursor-pointer rounded-l-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                      />
                      <button
                        type="button"
                        aria-label={`Beri rating ${star}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        className="absolute inset-y-0 right-0 w-1/2 cursor-pointer rounded-r-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                      />
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-center text-xs text-gray-500 sm:text-sm">
                {rating > 0
                  ? `Rating Anda: ${rating.toFixed(1)} / 5.0`
                  : "Klik sisi kiri atau kanan bintang untuk memberi rating 0.5"}
              </p>
            </div>

            {/* Kategori Pilihan (Muncul jika rating sudah diisi) */}
            {rating > 0 && (
              <div className="animate-fade-in space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apa yang membuat Anda memberi {rating.toFixed(1)} bintang?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {listKategori.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setKategori(item)}
                        className={`cursor-pointer rounded-full border px-3 py-2 text-sm transition-all hover:-translate-y-0.5 sm:px-4 ${
                          kategori === item
                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  id="komentar"
                  rows={2}
                  value={komentar}
                  onChange={(e) => setKomentar(e.target.value)}
                  placeholder="Ada saran atau keluhan tambahan? (Opsional)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                ></textarea>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all sm:text-base ${
                    isLoading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "cursor-pointer bg-blue-600 hover:bg-blue-700 hover:shadow-xl"
                  }`}
                >
                  {isLoading ? "Menghubungkan..." : "Terhubung ke Internet"}
                </button>
              </div>
            )}

            {rating === 0 && (
              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="cursor-pointer text-sm font-medium text-gray-400 underline underline-offset-4 transition-colors hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "Tunggu sebentar..."
                    : "Lewati & Hubungkan Wi-Fi"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default FeedbackForm;

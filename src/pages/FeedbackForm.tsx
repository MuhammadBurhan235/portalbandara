import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { FileCheck, Globe, Star, Wifi } from "lucide-react";
import { apiClient } from "../api/axios";

type FeedbackCategory =
  | "Informasi & Prosedur"
  | "Sarana Prasarana"
  | "Sikap Petugas"
  | "Waktu & Biaya"
  | "Lainnya";

const WIFI_FALLBACK_URL =
  import.meta.env.VITE_WIFI_FALLBACK_URL?.trim() || "https://google.com";
const HOTSPOT_USERNAME = import.meta.env.VITE_HOTSPOT_USERNAME?.trim();
const HOTSPOT_PASSWORD = import.meta.env.VITE_HOTSPOT_PASSWORD?.trim();
const KEMENHUB_SURVEY_URL =
  import.meta.env.VITE_KEMENHUB_SURVEY_URL?.trim() ||
  "https://skm.dephub.go.id/ly/RyaWiIlE";

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
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null,
  );
  const hasTriggeredRedirect = useRef(false);

  const listKategori: FeedbackCategory[] = [
    "Informasi & Prosedur",
    "Sarana Prasarana",
    "Sikap Petugas",
    "Waktu & Biaya",
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

  useEffect(() => {
    if (!isSubmitted) {
      setRedirectCountdown(null);
      hasTriggeredRedirect.current = false;
      return;
    }

    hasTriggeredRedirect.current = false;
    setRedirectCountdown(5);

    const countdownInterval = window.setInterval(() => {
      setRedirectCountdown((currentCountdown) => {
        if (currentCountdown === null) {
          return 0;
        }

        return Math.max(currentCountdown - 1, 0);
      });
    }, 1000);

    const redirectTimeout = window.setTimeout(() => {
      hasTriggeredRedirect.current = true;
      prosesKoneksiWiFi(KEMENHUB_SURVEY_URL);
    }, 5000);

    return () => {
      window.clearInterval(countdownInterval);
      window.clearTimeout(redirectTimeout);
    };
  }, [isSubmitted, linkLogin, macAddress]);

  const prosesKoneksiWiFi = (targetUrl: string) => {
    if (linkLogin && HOTSPOT_USERNAME && HOTSPOT_PASSWORD) {
      const urlTujuan = new URL(linkLogin, window.location.origin);
      urlTujuan.searchParams.set("username", HOTSPOT_USERNAME);
      urlTujuan.searchParams.set("password", HOTSPOT_PASSWORD);
      urlTujuan.searchParams.set("dst", targetUrl);
      window.location.assign(urlTujuan.toString());
      return;
    }

    if (linkLogin) {
      const urlTujuan = new URL(linkLogin, window.location.origin);
      urlTujuan.searchParams.set("dst", targetUrl);
      window.location.assign(urlTujuan.toString());
      return;
    }

    if (import.meta.env.DEV && macAddress) {
      console.info(`MAC Address terdeteksi: ${macAddress}`);
    }

    window.location.assign(targetUrl);
  };

  const handleRedirect = (targetUrl: string) => {
    hasTriggeredRedirect.current = true;
    prosesKoneksiWiFi(targetUrl);
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

      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert(`${getErrorMessage(error)} Anda tetap akan dihubungkan ke Wi-Fi.`);
      prosesKoneksiWiFi(WIFI_FALLBACK_URL);
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
      prosesKoneksiWiFi(WIFI_FALLBACK_URL);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-6 sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
        <div className="relative overflow-hidden bg-blue-600 px-6 py-7 text-center text-white sm:p-8">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500 opacity-50 blur-2xl"></div>
          <Wifi className="relative z-10 mx-auto mb-3 h-10 w-10 sm:h-12 sm:w-12" />
          <h1 className="relative z-10 text-xl font-bold sm:text-2xl">
            Free Wi-Fi Airport
          </h1>
          <p className="relative z-10 mt-2 text-sm leading-relaxed text-blue-100">
            {isSubmitted
              ? "Akses Internet Terbuka!"
              : "Bantu kami jadi lebih baik, nikmati Wi-Fi sepuasnya."}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {isSubmitted ? (
            <div className="animate-fade-in space-y-6 text-center">
              <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm font-medium text-green-700">
                Terima kasih! Penilaian singkat Anda telah tersimpan.
              </div>

              <div className="space-y-3">
                <p className="mb-4 text-sm leading-relaxed text-gray-600">
                  Punya waktu ekstra? Bantu Manajemen Bandara Mutiara SIS Al
                  Jufri mengisi <b>Survei Resmi Kemenhub</b> untuk layanan yang
                  lebih unggul.
                </p>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Anda akan diarahkan otomatis ke survei Kemenhub dalam{" "}
                  <b>{redirectCountdown ?? 0}</b> detik.
                </div>

                <button
                  type="button"
                  onClick={() => handleRedirect(KEMENHUB_SURVEY_URL)}
                  className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-700 sm:text-base"
                >
                  <FileCheck className="h-5 w-5" />
                  Isi Survei Kemenhub
                </button>

                <button
                  type="button"
                  onClick={() => handleRedirect(WIFI_FALLBACK_URL)}
                  className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-200 sm:text-base"
                >
                  <Globe className="h-5 w-5" />
                  Lewati & Mulai Browsing
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
                  Bagaimana pengalaman Anda hari ini?
                </h2>
                <p className="text-sm text-gray-500">Lokasi aktif: {lokasi}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div
                    className="flex flex-wrap justify-center gap-2 sm:flex-nowrap"
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`Beri rating ${star}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        className="cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                      >
                        <Star
                          className={`h-11 w-11 transition-all duration-200 sm:h-12 sm:w-12 ${
                            star <= (hoveredRating || rating)
                              ? "fill-yellow-400 text-yellow-400 drop-shadow-md"
                              : "text-gray-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <p className="mt-3 text-center text-xs text-gray-500 sm:text-sm">
                    {rating > 0
                      ? `Rating Anda: ${rating} / 5`
                      : "Pilih rating dari 1 sampai 5 bintang"}
                  </p>
                </div>

                {rating > 0 && (
                  <div className="animate-fade-in space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Apa yang membuat Anda memberi {rating} bintang?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {listKategori.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setKategori(item)}
                            className={`cursor-pointer rounded-full border px-3 py-2 text-sm transition-all hover:-translate-y-0.5 sm:px-4 ${
                              kategori === item
                                ? "border-blue-600 bg-blue-600 text-white shadow-md"
                                : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50"
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
                          ? "cursor-not-allowed bg-gray-300"
                          : "cursor-pointer bg-blue-600 hover:bg-blue-700 hover:shadow-xl"
                      }`}
                    >
                      {isLoading ? "Menyimpan..." : "Kirim Penilaian"}
                    </button>
                  </div>
                )}

                {rating === 0 && (
                  <div className="pt-4 text-center">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackForm;

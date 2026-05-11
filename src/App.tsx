import { useEffect, useState } from "react";
import { Star, Wifi } from "lucide-react";
import { apiClient } from "./api/axios";

function App() {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [kategori, setKategori] = useState<string>("");
  const [komentar, setKomentar] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lokasi, setLokasi] = useState<string>("Portal Utama");
  const activeRating = hoveredRating || rating;

  const listKategori = [
    "Kebersihan",
    "Kecepatan Layanan",
    "Fasilitas",
    "Keamanan",
    "Lainnya",
  ];

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const lokasiDariURL = queryParams.get("loc");

    if (lokasiDariURL) {
      setLokasi(lokasiDariURL.replace(/_/g, " "));
    }
  }, []);

  const prosesKoneksiWiFi = () => {
    alert(`Mengarahkan ke internet... (Lokasi tercatat: ${lokasi})`);
    window.location.href = "https://google.com";
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
      alert(
        "Gagal menyimpan feedback, tapi Anda tetap akan dihubungkan ke Wi-Fi.",
      );
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
    } finally {
      prosesKoneksiWiFi();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header Section */}
        <div className="bg-blue-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full opacity-50 blur-2xl"></div>
          <Wifi className="w-12 h-12 mx-auto mb-3 relative z-10" />
          <h1 className="text-2xl font-bold relative z-10">
            Free Wi-Fi Airport
          </h1>
          <p className="text-sm text-blue-100 mt-2 relative z-10">
            Bantu kami jadi lebih baik, nikmati Wi-Fi sepuasnya.
          </p>
        </div>

        {/* Form Section */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Bagaimana pengalaman Anda hari ini?
            </h2>
            <p className="text-sm text-gray-500">Lokasi aktif: {lokasi}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Bintang */}
            <div>
              <div
                className="flex justify-center gap-2"
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
                      className="relative h-12 w-12 transition-transform hover:scale-125"
                    >
                      <Star className="h-12 w-12 text-gray-200" />
                      <div
                        className="absolute inset-y-0 left-0 overflow-hidden"
                        style={{ width: `${fillPercentage * 100}%` }}
                      >
                        <Star className="h-12 w-12 fill-yellow-400 text-yellow-400 drop-shadow-md" />
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

              <p className="mt-3 text-center text-sm text-gray-500">
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
                        className={`cursor-pointer px-4 py-2 text-sm rounded-full border transition-all hover:-translate-y-0.5 ${
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
                  className="w-full p-3 text-sm border border-gray-200 rounded-xl outline-none bg-gray-50 transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
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

export default App;

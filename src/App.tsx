import { useState } from "react";
import { Star, Plane } from "lucide-react";
import { apiClient } from "./api/axios";

function App() {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [kategori, setKategori] = useState<string>("");
  const [komentar, setKomentar] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const activeRating = hoveredRating || rating;

  const listKategori = [
    "Kebersihan",
    "Kecepatan Layanan",
    "Fasilitas",
    "Keamanan",
    "Lainnya",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      await apiClient.post("/feedback", {
        lokasi_scan: "Portal Utama",
        rating,
        kategori_layanan: kategori,
        komentar,
      });

      alert("Terima kasih atas penilaian Anda! Mengalihkan ke internet...");
      setRating(0);
      setHoveredRating(0);
      setKategori("");
      setKomentar("");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengirim data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <Plane className="w-10 h-10 mx-auto mb-2" />
          <h1 className="text-xl font-bold">
            Bandara Internasional Mutiara SIS Al Jufri
          </h1>
          <p className="text-sm text-blue-100 mt-1">
            Free Wi-Fi Captive Portal (Feedback)
          </p>
        </div>

        {/* Form Section */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Bagaimana pengalaman Anda hari ini?
            </h2>
            <p className="text-sm text-gray-500">
              Berikan penilaian untuk terhubung ke internet
            </p>
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
                      className="relative h-10 w-10 transition-transform hover:scale-110"
                    >
                      <Star className="h-10 w-10 text-gray-300" />
                      <div
                        className="absolute inset-y-0 left-0 overflow-hidden"
                        style={{ width: `${fillPercentage * 100}%` }}
                      >
                        <Star className="h-10 w-10 fill-yellow-400 text-yellow-400" />
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
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apa yang paling mendeskripsikan penilaian Anda?
                </label>
                <div className="flex flex-wrap gap-2">
                  {listKategori.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setKategori(item)}
                      className={`cursor-pointer px-3 py-1.5 text-sm rounded-full border transition-all hover:-translate-y-0.5 ${
                        kategori === item
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kolom Komentar */}
            {rating > 0 && (
              <div className="animate-fade-in">
                <label
                  htmlFor="komentar"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Saran atau masukan tambahan (opsional)
                </label>
                <textarea
                  id="komentar"
                  rows={3}
                  value={komentar}
                  onChange={(e) => setKomentar(e.target.value)}
                  placeholder="Ceritakan lebih lanjut di sini..."
                  className="w-full p-3 border border-gray-300 rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300"
                ></textarea>
              </div>
            )}

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={rating === 0 || isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                rating > 0 && !isLoading
                  ? "cursor-pointer bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {isLoading ? "Mengirim..." : "Kirim & Hubungkan Wi-Fi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;

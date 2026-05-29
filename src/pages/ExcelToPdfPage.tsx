import axios from "axios";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarRange,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import { apiClient } from "../api/axios";

type QueuedFile = {
  id: string;
  file: File;
};

const monthOrder = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
] as const;

const getMonthIndexFromFilename = (filename: string) => {
  const normalizedFilename = filename.toLowerCase();
  return monthOrder.findIndex((month) => normalizedFilename.includes(month));
};

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const extractFilename = (contentDispositionHeader?: string) => {
  if (!contentDispositionHeader) {
    return `rekap-excel-${Date.now()}.pdf`;
  }

  const filenameMatch = contentDispositionHeader.match(
    /filename="?([^";]+)"?/i,
  );
  return filenameMatch?.[1] || `rekap-excel-${Date.now()}.pdf`;
};

const getApiErrorMessage = async (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return "Konversi Excel ke PDF gagal diproses.";
  }

  const responseData = error.response?.data;

  if (responseData instanceof Blob) {
    try {
      const responseText = await responseData.text();
      const parsed = JSON.parse(responseText) as { message?: string };

      if (parsed.message) {
        return parsed.message;
      }
    } catch {
      return "Konversi Excel ke PDF gagal diproses.";
    }
  }

  return (
    error.response?.data?.message ||
    error.message ||
    "Konversi Excel ke PDF gagal diproses."
  );
};

export default function ExcelToPdfPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const totalSize = useMemo(
    () =>
      queuedFiles.reduce(
        (total, queuedFile) => total + queuedFile.file.size,
        0,
      ),
    [queuedFiles],
  );

  const handleSelectFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setQueuedFiles((currentFiles) => [
      ...currentFiles,
      ...selectedFiles.map((file, index) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${index}-${crypto.randomUUID()}`,
        file,
      })),
    ]);
    setErrorMessage("");
    setSuccessMessage("");
    event.target.value = "";
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    setQueuedFiles((currentFiles) => {
      if (toIndex < 0 || toIndex >= currentFiles.length) {
        return currentFiles;
      }

      const nextFiles = [...currentFiles];
      const [movedFile] = nextFiles.splice(fromIndex, 1);
      nextFiles.splice(toIndex, 0, movedFile);
      return nextFiles;
    });
  };

  const removeFile = (id: string) => {
    setQueuedFiles((currentFiles) =>
      currentFiles.filter((queuedFile) => queuedFile.id !== id),
    );
  };

  const sortByMonthName = () => {
    setQueuedFiles((currentFiles) => {
      return [...currentFiles].sort((firstFile, secondFile) => {
        const firstMonthIndex = getMonthIndexFromFilename(firstFile.file.name);
        const secondMonthIndex = getMonthIndexFromFilename(
          secondFile.file.name,
        );

        if (firstMonthIndex === -1 && secondMonthIndex === -1) {
          return 0;
        }

        if (firstMonthIndex === -1) {
          return 1;
        }

        if (secondMonthIndex === -1) {
          return -1;
        }

        return firstMonthIndex - secondMonthIndex;
      });
    });
  };

  const handleConvert = async () => {
    if (queuedFiles.length === 0) {
      setErrorMessage("Pilih minimal satu file Excel sebelum mengonversi.");
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData();
    queuedFiles.forEach((queuedFile) => {
      formData.append("files[]", queuedFile.file);
    });

    try {
      const response = await apiClient.post("/excel-to-pdf", formData, {
        responseType: "blob",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000,
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = extractFilename(
        response.headers["content-disposition"],
      );
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage("PDF berhasil dibuat dan unduhan dimulai.");
    } catch (error) {
      setErrorMessage(await getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[28px] bg-linear-to-br from-slate-950 via-slate-800 to-cyan-900 px-6 py-7 text-white shadow-2xl sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Link
                to="/admin"
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/90 transition-all hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard
              </Link>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                  <FileText className="h-8 w-8 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/90">
                    Konversi Rekap MCU
                  </p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                    Excel ke PDF berurutan per sheet
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                Urutan file di antrean akan menjadi urutan isi PDF. Setiap sheet
                dimulai dari halaman baru, dan jika tabelnya panjang maka
                halaman akan otomatis berlanjut ke halaman berikutnya.
              </p>
            </div>

            <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Jumlah file
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {queuedFiles.length}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Total ukuran
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatFileSize(totalSize || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Urutan
                </p>
                <p className="mt-2 text-sm font-medium text-cyan-100">
                  {queuedFiles.length > 0
                    ? "Dikirim sesuai antrean"
                    : "Belum ada file"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Unggah file Excel
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Tambahkan satu atau lebih file .xls, .xlsx, atau .xlsm. Anda
                  juga bisa unggah bertahap agar urutan bulan lebih mudah
                  diatur.
                </p>
              </div>

              <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-3 rounded-3xl border border-dashed border-cyan-300 bg-cyan-50/60 px-6 py-10 text-center text-slate-700 transition-all hover:border-cyan-400 hover:bg-cyan-50"
            >
              <div className="rounded-full bg-white p-3 text-cyan-700 shadow-sm">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Pilih file Excel
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Klik untuk menambahkan file ke antrean konversi
                </p>
              </div>
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".xls,.xlsx,.xlsm,.csv"
              className="hidden"
              onChange={handleSelectFiles}
            />

            <div className="mt-6 grid gap-3 rounded-3xl bg-slate-50 p-4">
              <div className="flex items-start gap-3 rounded-2xl bg-white p-4">
                <CalendarRange className="mt-0.5 h-5 w-5 text-cyan-700" />
                <div>
                  <p className="font-semibold text-slate-900">
                    Perlu urut Januari sampai Desember?
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Gunakan tombol urut bulan jika nama file mengandung nama
                    bulan. Jika tidak, atur manual dengan tombol naik dan turun.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={sortByMonthName}
                  disabled={queuedFiles.length < 2}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Urutkan Januari-Desember
                </button>

                <button
                  type="button"
                  onClick={() => setQueuedFiles([])}
                  disabled={queuedFiles.length === 0}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Kosongkan antrean
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Antrean PDF
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Posisi file menentukan urutan halaman di PDF. Sheet pertama
                  pada file pertama akan muncul duluan, lalu sheet berikutnya,
                  hingga file terakhir.
                </p>
              </div>

              <button
                type="button"
                onClick={handleConvert}
                disabled={queuedFiles.length === 0 || isSubmitting}
                className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isSubmitting ? "Memproses PDF..." : "Buat PDF"}
              </button>
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {queuedFiles.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                  Belum ada file di antrean. Tambahkan file Excel di panel
                  sebelah kiri.
                </div>
              ) : (
                queuedFiles.map((queuedFile, index) => (
                  <div
                    key={queuedFile.id}
                    className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-bold text-slate-900 shadow-sm">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                        {queuedFile.file.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatFileSize(queuedFile.file.size)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveFile(index, index - 1)}
                        disabled={index === 0}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition-all hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Naikkan urutan ${queuedFile.file.name}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveFile(index, index + 1)}
                        disabled={index === queuedFiles.length - 1}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition-all hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Turunkan urutan ${queuedFile.file.name}`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFile(queuedFile.id)}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition-all hover:border-red-200 hover:text-red-600"
                        aria-label={`Hapus ${queuedFile.file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

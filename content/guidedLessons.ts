import type { ShaPhase } from "@/lib/sha256/types";

type GuidedCheckpoint = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correctId: string;
};

export type GuidedLesson = {
  scene: string;
  whatNow: string;
  whyItMatters: string;
  remember: string;
  checkpoint?: GuidedCheckpoint;
};

const parseCheckpoint: GuidedCheckpoint = {
  id: "parse-words",
  question: "На сколько слов по 32 бита разбивается один 512-битный блок?",
  options: [
    { id: "8", label: "8 слов" },
    { id: "16", label: "16 слов" },
    { id: "32", label: "32 слова" },
  ],
  correctId: "16",
};

const scheduleCheckpoint: GuidedCheckpoint = {
  id: "schedule-growth",
  question: "Для t >= 16 новое W[t] строится из:",
  options: [
    { id: "current", label: "Только из W[t]" },
    { id: "mix", label: "W[t-2], W[t-7], W[t-15], W[t-16]" },
    { id: "k", label: "Только из констант K[t]" },
  ],
  correctId: "mix",
};

const compressCheckpoint: GuidedCheckpoint = {
  id: "compress-main",
  question: "Какие суммы управляют обновлением регистров в раунде?",
  options: [
    { id: "t1t2", label: "T1 и T2" },
    { id: "chmaj", label: "Только Ch и Maj" },
    { id: "s01", label: "Только Sigma функции" },
  ],
  correctId: "t1t2",
};

const finalizeCheckpoint: GuidedCheckpoint = {
  id: "finalize-idea",
  question: "Что происходит после 64 раундов для блока?",
  options: [
    { id: "discard", label: "Рабочие регистры обнуляются" },
    { id: "add", label: "Рабочие регистры прибавляются к H[0..7]" },
    { id: "xor", label: "Все слова XOR-ятся с K[t]" },
  ],
  correctId: "add",
};

export const guidedLessonsByPhase: Record<ShaPhase, GuidedLesson> = {
  padding: {
    scene: "Сцена 1: Подготовка",
    whatNow: "Добавляем бит 1, затем нули и длину сообщения, чтобы получить блоки по 512 бит.",
    whyItMatters: "Алгоритм работает строго с блоками фиксированной длины.",
    remember: "Padding кодирует и структуру, и исходную длину данных.",
  },
  parse_block: {
    scene: "Сцена 2: Разбор блока",
    whatNow: "Делим блок на 16 исходных слов M0..M15 по 32 бита (big-endian).",
    whyItMatters: "Это стартовая база для расширенного расписания.",
    remember: "Порядок байт в слове важен для результата.",
    checkpoint: parseCheckpoint,
  },
  schedule: {
    scene: "Сцена 3: Расписание W",
    whatNow: "Расширяем 16 слов до 64 слов W[t] через Sigma-функции и суммы по mod 2^32.",
    whyItMatters: "Каждый раунд берет новое W[t], это сильно перемешивает вход.",
    remember: "После t=15 начинают влиять прошлые слова по формуле.",
    checkpoint: scheduleCheckpoint,
  },
  compress_start: {
    scene: "Сцена 4: Сжатие",
    whatNow: "Копируем текущий H в рабочие регистры a..h и готовимся к 64 раундам.",
    whyItMatters: "Это внутреннее состояние, где идет основная криптографическая работа.",
    remember: "a..h постоянно обновляются и зависят от всех компонентов формулы.",
    checkpoint: compressCheckpoint,
  },
  compress_ch_sig1: {
    scene: "Сцена 4: Сжатие",
    whatNow: "Считаем Sigma1(e) и Ch(e,f,g): выбор битов по текущему e.",
    whyItMatters: "Эта часть создает нелинейность и усиливает перемешивание.",
    remember: "Ch выбирает между f и g по маске из e.",
  },
  compress_maj_sig0: {
    scene: "Сцена 4: Сжатие",
    whatNow: "Считаем Sigma0(a) и Maj(a,b,c): большинство битов из трех регистров.",
    whyItMatters: "Maj стабилизирует и распределяет вклад верхней части состояния.",
    remember: "Maj возвращает бит, который встречается минимум в двух из трех.",
  },
  compress_t1: {
    scene: "Сцена 4: Сжатие",
    whatNow: "Собираем T1 = h + Sigma1 + Ch + K[t] + W[t] по mod 2^32.",
    whyItMatters: "T1 несет основной вклад раунда в обновление e и a.",
    remember: "В T1 сходятся и текущие регистры, и константы, и расписание.",
  },
  compress_t2_update: {
    scene: "Сцена 4: Сжатие",
    whatNow: "Считаем T2 = Sigma0 + Maj и обновляем все регистры a..h.",
    whyItMatters: "После обновления состояние сдвигается и готово к следующему раунду.",
    remember: "Новый a = T1 + T2, новый e = d + T1.",
  },
  block_finalize: {
    scene: "Сцена 5: Обновление H",
    whatNow: "Прибавляем рабочие регистры к накопленному H[0..7].",
    whyItMatters: "Так вклад текущего блока фиксируется в итоговом состоянии.",
    remember: "Каждый блок меняет общий хеш-стейт перед следующим блоком.",
    checkpoint: finalizeCheckpoint,
  },
  complete: {
    scene: "Сцена 6: Финальный дайджест",
    whatNow: "Соединяем H0..H7 в 256-битный итоговый хеш.",
    whyItMatters: "Это финальный fingerprint сообщения.",
    remember: "Даже маленькое изменение входа ведет к сильно другому дайджесту.",
  },
};

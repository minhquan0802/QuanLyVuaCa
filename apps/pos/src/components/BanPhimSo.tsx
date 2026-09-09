/**
 * Bàn phím số trên màn hình — dùng cho máy cảm ứng.
 *
 * Bàn phím vật lý vẫn dùng song song được: ô nhập không bị readOnly. Đây là
 * chủ ý, không phải quên — màn hình cảm ứng điện dung hay loạn khi dính nước,
 * mà ở vựa cá thì tay ướt là chuyện bình thường.
 */

const PHIM = ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', '⌫'] as const;

interface Props {
  giaTri: string;
  onDoi: (giaTri: string) => void;
  onXoaHet?: () => void;
}

export default function BanPhimSo({ giaTri, onDoi, onXoaHet }: Props) {
  function bam(phim: string) {
    if (phim === '⌫') {
      onDoi(giaTri.slice(0, -1));
      return;
    }
    if (phim === ',') {
      if (giaTri.includes(',')) return;
      onDoi((giaTri === '' ? '0' : giaTri) + ',');
      return;
    }
    // Gõ số đầu tiên thì thay luôn số cũ, khỏi phải xoá từng chữ số
    onDoi(giaTri === '0' ? phim : giaTri + phim);
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {PHIM.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => bam(p)}
          className={[
            'h-16 rounded-xl border text-2xl font-bold transition active:scale-95',
            p === '⌫'
              ? 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
          ].join(' ')}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => (onXoaHet ? onXoaHet() : onDoi(''))}
        className="col-span-3 h-14 rounded-xl border border-slate-300 bg-slate-100 text-lg font-bold text-slate-600 transition hover:bg-slate-200 active:scale-95"
      >
        Xoá hết
      </button>
    </div>
  );
}

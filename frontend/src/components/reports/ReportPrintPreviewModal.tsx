import { Printer, UtensilsCrossed } from 'lucide-react';
import { RevenueReport } from '../../types';
import { formatFullDateVi, formatVnd, MENU_CATEGORY_LABELS } from '../../utils';
import { Modal } from '../common/Modal';

interface ReportPrintPreviewModalProps {
  open: boolean;
  report: RevenueReport | null;
  onClose: () => void;
}

export function ReportPrintPreviewModal({
  open,
  report,
  onClose,
}: ReportPrintPreviewModalProps) {
  if (!report) return null;

  function handlePrintPdf() {
    window.print();
  }

  return (
    <Modal
      open={open}
      title="Xem trước bản in báo cáo (PDF)"
      subtitle="Kiểm tra nội dung báo cáo tài chính trước khi in hoặc lưu dưới dạng tệp PDF"
      onClose={onClose}
      maxWidthClass="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#DCD7CE] bg-white px-4 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F2EFEA] focus-visible:outline-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>In / Lưu PDF</span>
          </button>
        </>
      }
    >
      <div
        id="printable-revenue-report"
        className="space-y-6 rounded-lg border border-[#E6E2DC] bg-white p-6 sm:p-8 text-[#1F1D1A]"
      >
        {/* Tiêu đề chứng từ in */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-[#E6E2DC]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C2572B] text-white">
              <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none">
                Nhà hàng Bếp Việt
              </p>
              <p className="mt-1 text-xs text-[#5E5850]">
                Hệ thống Quản lý Nhà hàng · Báo cáo doanh thu định kỳ
              </p>
            </div>
          </div>

          <div className="sm:text-right text-xs text-[#5E5850] space-y-0.5">
            <p className="font-semibold text-[#1F1D1A]">
              Kỳ báo cáo: {formatFullDateVi(report.startDate)} –{' '}
              {formatFullDateVi(report.endDate)}
            </p>
            <p>Đơn vị tiền tệ: Việt Nam Đồng (VNĐ)</p>
          </div>
        </div>

        {/* Tóm tắt 4 chỉ số KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[#E6E2DC] p-3.5">
            <p className="text-xs text-[#6E675E]">Tổng doanh thu</p>
            <p className="mt-1 font-display text-lg font-bold tabular-nums">
              {formatVnd(report.totalRevenueVnd)}
            </p>
          </div>
          <div className="rounded-lg border border-[#E6E2DC] p-3.5">
            <p className="text-xs text-[#6E675E]">Tổng số hóa đơn</p>
            <p className="mt-1 font-display text-lg font-bold tabular-nums">
              {report.totalInvoices.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="rounded-lg border border-[#E6E2DC] p-3.5">
            <p className="text-xs text-[#6E675E]">Trung bình / đơn</p>
            <p className="mt-1 font-display text-lg font-bold tabular-nums">
              {formatVnd(report.averageOrderValueVnd)}
            </p>
          </div>
          <div className="rounded-lg border border-[#E6E2DC] p-3.5">
            <p className="text-xs text-[#6E675E]">Món bán chạy nhất</p>
            <p className="mt-1 font-display text-sm font-bold leading-snug">
              {report.bestSellingDish
                ? `${report.bestSellingDish.menuItemName} (${report.bestSellingDish.quantitySold})`
                : '—'}
            </p>
          </div>
        </div>

        {/* Tỉ trọng theo danh mục */}
        <div className="space-y-2.5">
          <h3 className="font-display text-sm font-semibold text-[#1F1D1A]">
            1. Cơ cấu doanh thu theo danh mục món
          </h3>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-y border-[#E6E2DC] bg-[#FAF9F7] text-[#5E5850]">
                <th className="py-2 px-3 font-semibold">Danh mục</th>
                <th className="py-2 px-3 font-semibold text-right">Số lượng bán</th>
                <th className="py-2 px-3 font-semibold text-right">Doanh thu</th>
                <th className="py-2 px-3 font-semibold text-right">Tỉ trọng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {report.categoryShares.map((item) => (
                <tr key={item.category}>
                  <td className="py-2 px-3 font-medium">{item.label}</td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {item.quantitySold.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold tabular-nums">
                    {formatVnd(item.revenueVnd)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {item.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top món ăn đóng góp doanh thu */}
        <div className="space-y-2.5">
          <h3 className="font-display text-sm font-semibold text-[#1F1D1A]">
            2. Danh sách món bán chạy trong kỳ
          </h3>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-y border-[#E6E2DC] bg-[#FAF9F7] text-[#5E5850]">
                <th className="py-2 px-3 font-semibold">Tên món</th>
                <th className="py-2 px-3 font-semibold">Danh mục</th>
                <th className="py-2 px-3 font-semibold text-right">SL bán</th>
                <th className="py-2 px-3 font-semibold text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {report.topDishes.slice(0, 6).map((dish) => (
                <tr key={dish.menuItemId}>
                  <td className="py-2 px-3 font-medium">{dish.menuItemName}</td>
                  <td className="py-2 px-3 text-[#5E5850]">
                    {MENU_CATEGORY_LABELS[dish.category]}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {dish.quantitySold.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold tabular-nums">
                    {formatVnd(dish.revenueVnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Doanh thu theo ngày */}
        <div className="space-y-2.5">
          <h3 className="font-display text-sm font-semibold text-[#1F1D1A]">
            3. Chi tiết doanh thu theo ngày
          </h3>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-y border-[#E6E2DC] bg-[#FAF9F7] text-[#5E5850]">
                <th className="py-2 px-3 font-semibold">Ngày</th>
                <th className="py-2 px-3 font-semibold text-right">Số hóa đơn</th>
                <th className="py-2 px-3 font-semibold text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {report.dailySeries.map((day) => (
                <tr key={day.date}>
                  <td className="py-2 px-3 tabular-nums">
                    {formatFullDateVi(day.date)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {day.invoiceCount.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold tabular-nums">
                    {formatVnd(day.revenueVnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Khu vực xác nhận ký tên */}
        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[#E6E2DC] text-center text-xs text-[#5E5850]">
          <div>
            <p className="font-semibold text-[#1F1D1A]">Người lập biểu</p>
            <p className="mt-10">Ký và ghi rõ họ tên</p>
          </div>
          <div>
            <p className="font-semibold text-[#1F1D1A]">Quản lý nhà hàng</p>
            <p className="mt-10">Nguyễn Minh Tuấn</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

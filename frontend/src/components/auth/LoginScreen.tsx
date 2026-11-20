import { FormEvent, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ChefHat,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  UserCheck,
  UtensilsCrossed,
} from 'lucide-react';
import { LOGIN_HERO_IMAGE, MOCK_USERS } from '../../mocks';
import { authService } from '../../services';
import { LoginResponse, UserRole } from '../../types';
import { ROLE_LABELS } from '../../utils';
import { UserAvatar } from '../common/UserAvatar';

interface LoginScreenProps {
  onLoginSuccess: (session: LoginResponse) => void;
}

const DEMO_ROLES: {
  role: UserRole;
  summary: string;
  icon: typeof ShieldCheck;
}[] = [
  {
    role: UserRole.MANAGER,
    summary: 'Toàn quyền quản trị & báo cáo',
    icon: ShieldCheck,
  },
  {
    role: UserRole.STAFF,
    summary: 'Sơ đồ bàn, gọi món & thu ngân',
    icon: UserCheck,
  },
  {
    role: UserRole.CHEF,
    summary: 'Điều phối bếp & trạng thái món',
    icon: ChefHat,
  },
];

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<UserRole | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authService.login({ username, password });
      onLoginSuccess(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể đăng nhập lúc này. Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(role: UserRole) {
    setErrorMessage(null);
    setActiveDemoRole(role);
    try {
      const response = await authService.loginAsDemoRole(role);
      onLoginSuccess(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Đăng nhập demo thất bại.'
      );
    } finally {
      setActiveDemoRole(null);
    }
  }

  const isBusy = submitting || activeDemoRole !== null;

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-12 bg-[#F7F6F4]">
      {/* Cột trái: Ảnh không gian nhà hàng & nhận diện thương hiệu */}
      <aside className="relative hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between overflow-hidden bg-[#2A1F1A] p-10 xl:p-12 text-white">
        {!heroImageError ? (
          <img
            src={LOGIN_HERO_IMAGE}
            alt="Không gian phòng ăn ấm cúng của nhà hàng Bếp Việt"
            referrerPolicy="no-referrer"
            onError={() => setHeroImageError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-[#5B2A16] via-[#3A1E14] to-[#1F1713]"
          />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#1A130F]/90 via-[#1A130F]/35 to-[#1A130F]/30"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C2572B] text-white shadow-sm">
            <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight leading-none">
              Bếp Việt
            </p>
            <p className="mt-1 text-xs text-white/80">
              Hệ thống Quản lý Nhà hàng
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <h2 className="font-display text-3xl xl:text-[34px] font-semibold leading-tight tracking-tight text-balance">
            Vận hành nhà hàng mạch lạc từ sảnh đón khách đến căn bếp.
          </h2>
          <p className="text-sm leading-relaxed text-white/85">
            Đồng bộ sơ đồ bàn, đơn gọi món, hàng đợi bếp và thanh toán VNĐ trên
            nền tảng sẵn sàng tích hợp Java REST API.
          </p>
          <div className="pt-2 border-t border-white/20 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/80">
            <span>Sơ đồ bàn</span>
            <span aria-hidden="true">·</span>
            <span>Đơn gọi món</span>
            <span aria-hidden="true">·</span>
            <span>Điều phối bếp</span>
            <span aria-hidden="true">·</span>
            <span>Hóa đơn VNĐ</span>
          </div>
        </div>
      </aside>

      {/* Cột phải: Biểu mẫu đăng nhập */}
      <main className="lg:col-span-7 xl:col-span-7 flex flex-col justify-center items-center px-5 py-8 sm:px-10 lg:px-16 bg-white">
        <div className="w-full max-w-[440px] space-y-7">
          {/* Nhận diện thương hiệu trên thiết bị di động */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C2572B] text-white">
              <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-[#1F1D1A] leading-none">
                Bếp Việt
              </p>
              <p className="mt-1 text-xs text-[#5E5850]">
                Hệ thống Quản lý Nhà hàng
              </p>
            </div>
          </div>

          {/* Tiêu đề màn hình đăng nhập */}
          <header className="space-y-2">
            <h1 className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-[#1F1D1A] text-balance">
              Đăng nhập hệ thống
            </h1>
            <p className="text-sm text-[#5E5850] leading-relaxed">
              Nhập tài khoản nhân sự để truy cập không gian làm việc theo đúng
              vai trò được phân quyền.
            </p>
          </header>

          {/* Thông báo lỗi xác thực */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-[#F3C5C0] bg-[#FEF3F2] px-3.5 py-3 text-sm text-[#B42318]"
            >
              <AlertCircle
                className="h-4 w-4 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form đăng nhập chính */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-username"
                className="block text-sm font-medium text-[#1F1D1A]"
              >
                Tên đăng nhập
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Ví dụ: quanly, nhanvien, bep"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isBusy}
                className="h-11 w-full rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] px-3.5 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] transition-colors focus:border-[#C2572B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20 disabled:opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-[#1F1D1A]"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu (mặc định: 123456)"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isBusy}
                  className="h-11 w-full rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] pl-3.5 pr-11 text-sm text-[#1F1D1A] placeholder:text-[#8A8378] transition-colors focus:border-[#C2572B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6E675E] hover:bg-[#EFECE6] hover:text-[#1F1D1A] focus-visible:outline-2 focus-visible:outline-[#C2572B]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Khu vực Đăng nhập nhanh (Demo) cho 3 vai trò */}
          <section
            aria-labelledby="demo-login-heading"
            className="pt-5 border-t border-[#E6E2DC] space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="demo-login-heading"
                className="text-sm font-semibold text-[#1F1D1A]"
              >
                Đăng nhập nhanh (Demo)
              </h2>
              <span className="text-xs text-[#6E675E]">
                Chuyển đổi 3 vai trò
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {DEMO_ROLES.map(({ role, summary, icon: RoleIcon }) => {
                const demoUser = MOCK_USERS.find((u) => u.role === role);
                const isLoadingRole = activeDemoRole === role;

                return (
                  <button
                    key={role}
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDemoLogin(role)}
                    className="group flex min-h-[58px] w-full items-center justify-between gap-3 rounded-lg border border-[#E6E2DC] bg-[#FAF9F7] px-3.5 py-2.5 text-left transition-colors hover:border-[#C2572B]/60 hover:bg-[#FDF5F1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] disabled:opacity-60 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        name={demoUser?.fullName ?? ROLE_LABELS[role]}
                        avatarUrl={demoUser?.avatarUrl}
                        size="sm"
                        decorative
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1D1A] group-hover:text-[#9A3D18]">
                          <span className="truncate">{ROLE_LABELS[role]}</span>
                          <span
                            aria-hidden="true"
                            className="text-[#B8B0A4] font-normal"
                          >
                            ·
                          </span>
                          <span className="text-xs font-normal text-[#5E5850] truncate">
                            {demoUser?.fullName}
                          </span>
                        </div>
                        <p className="text-xs text-[#6E675E] truncate">
                          {summary}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-[#8A8378] group-hover:text-[#C2572B]">
                      {isLoadingRole ? (
                        <Loader2
                          className="h-4 w-4 animate-spin text-[#C2572B]"
                          aria-hidden="true"
                        />
                      ) : (
                        <RoleIcon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

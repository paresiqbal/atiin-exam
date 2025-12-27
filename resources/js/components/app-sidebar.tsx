import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Backpack,
    Book,
    FileUser,
    Folder,
    LayoutGrid,
    Newspaper,
    PersonStanding,
    University,
    UsersRound,
    Wallet,
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const page = usePage<{
        auth: { user: { role: string; is_pro?: boolean } | null };
    }>();

    const role = page.props.auth.user?.role;
    const isPro = !!page.props.auth.user?.is_pro;

    let mainNavItems: NavItem[] = [];

    if (role === 'admin') {
        mainNavItems = [
            {
                title: 'Dashboard',
                href: '/admin/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Ujian',
                href: '#',
                icon: Book,
                items: [
                    { title: 'Semua Ujian', href: '/admin/exams' },
                    { title: 'Buat Ujian', href: '/admin/exams/create' },
                ],
            },
            {
                title: 'Bank Soal',
                href: '#',
                icon: Folder,
                items: [
                    { title: 'Semua Bank Soal', href: '/admin/question-banks' },
                    {
                        title: 'Buat Bank Soal',
                        href: '/admin/question-banks/create',
                    },
                ],
            },
            {
                title: 'Universitas',
                href: '#',
                icon: University,
                items: [
                    { title: 'Semua Universitas', href: '/admin/universities' },
                    {
                        title: 'Buat Universitas',
                        href: '/admin/universities/create',
                    },
                ],
            },
            {
                title: 'Sekolah',
                href: '#',
                icon: Backpack,
                items: [
                    { title: 'Semua Sekolah', href: '/admin/schools' },
                    { title: 'Buat Sekolah', href: '/admin/schools/create' },
                ],
            },
            {
                title: 'Siswa',
                href: '#',
                icon: PersonStanding,
                items: [
                    { title: 'Semua Siswa', href: '/admin/students' },
                    { title: 'Buat Siswa', href: '/admin/students/create' },
                    { title: 'Buat Kartu', href: '/admin/students/cards' },
                ],
            },
            {
                title: 'Konsultan',
                href: '/admin/consultant-requests',
                icon: FileUser,
            },
            {
                title: 'Pembayaran',
                href: '/admin/payments',
                icon: Wallet,
            },
            {
                title: 'Berita',
                href: '#',
                icon: Newspaper,
                items: [
                    { title: 'Semua Berita', href: '/admin/news' },
                    { title: 'Buat Berita', href: '/admin/news/create' },
                ],
            },
            {
                title: 'Pengguna',
                href: '#',
                icon: UsersRound,
                items: [
                    { title: 'Semua Pengguna', href: '/admin/users' },
                    { title: 'Buat Pengguna', href: '/admin/users/create' },
                ],
            },
        ];
    } else if (role === 'teacher') {
        mainNavItems = [
            {
                title: 'Dashboard',
                href: '/teacher/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Bank Soal',
                href: '#',
                icon: Folder,
                items: [
                    {
                        title: 'Semua Bank Soal',
                        href: '/teacher/question-banks',
                    },
                    {
                        title: 'Buat Bank Soal',
                        href: '/teacher/question-banks/create',
                    },
                ],
            },
        ];
    } else {
        const studentItems: NavItem[] = [
            {
                title: 'Dashboard',
                href: '/student/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Ujian',
                href: '#',
                icon: Folder,
                items: [
                    { title: 'Daftar Ujian', href: '/student/exams' },
                    ...(isPro
                        ? [
                              {
                                  title: 'Ujian Saya',
                                  href: '/student/exams/history',
                              },
                          ]
                        : []),
                ],
            },
            ...(isPro
                ? [
                      {
                          title: 'Universitas',
                          href: '/student/universities',
                          icon: Book,
                      } as NavItem,
                  ]
                : []),
            {
                title: 'Berita',
                href: '/student/news',
                icon: Newspaper,
            },
            ...(isPro
                ? [
                      {
                          title: 'Konsultan',
                          href: '/student/consultant-requests',
                          icon: FileUser,
                      } as NavItem,
                  ]
                : []),
            {
                title: 'Pembayaran',
                href: '/student/account',
                icon: Book,
            },
        ];

        mainNavItems = studentItems;
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

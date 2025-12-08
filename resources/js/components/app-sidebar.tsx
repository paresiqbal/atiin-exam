import { NavFooter } from '@/components/nav-footer';
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
    BookOpen,
    Folder,
    LayoutGrid,
    PersonStanding,
    University,
    UsersRound,
} from 'lucide-react';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/paresiqbal/atiin-exam',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const page = usePage<{ auth: { user: { role: string } | null } }>();
    const role = page.props.auth.user?.role;

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
                    { title: 'Semua Exam', href: '/admin/exams' },
                    { title: 'Buat Exam', href: '/admin/exams/create' },
                ],
            },
            {
                title: 'Bank Soal',
                href: '#',
                icon: Folder,
                items: [
                    {
                        title: 'Semua Bank Soal',
                        href: '/admin/question-banks',
                    },
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
                    {
                        title: 'Buat Siswa',
                        href: '/admin/students/create',
                    },
                    {
                        title: 'Buat Kartu',
                        href: '/admin/students/cards',
                    },
                ],
            },
            {
                title: 'Pengguna',
                href: '#',
                icon: UsersRound,
                items: [
                    { title: 'Semua Pengguna', href: '/admin/users' },
                    {
                        title: 'Buat Pengguna',
                        href: '/admin/users/create',
                    },
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
        mainNavItems = [
            {
                title: 'Dashboard',
                href: '/student/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Exams',
                href: '#',
                icon: Folder,
                items: [
                    { title: 'Daftar Ujian', href: '/student/exams' },
                    { title: 'Ujian Saya', href: '/student/exams/history' },
                ],
            },
            {
                title: 'Universitas',
                href: '/student/universities',
                icon: Book,
            },
        ];
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

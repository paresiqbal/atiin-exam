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
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Book, BookOpen, Folder, LayoutGrid, User } from 'lucide-react';
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
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Manajemen Ujian',
                href: '#',
                icon: Book,
                items: [
                    { title: 'Semua Exam', href: '/admin/exams' },
                    { title: 'Buat Exam', href: '/admin/exams/create' },
                ],
            },
            {
                title: 'Manajemen User',
                href: '#',
                icon: User,
                items: [
                    { title: 'Semua User', href: '/admin/users' },
                    { title: 'Buat User', href: '/admin/users/create' },
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
                href: dashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Exams',
                href: '#',
                icon: Folder,
                items: [
                    { title: 'Join Exam', href: '/student/exams/join' },
                    { title: 'My Exams', href: '/student/exams' },
                ],
            },
        ];
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
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

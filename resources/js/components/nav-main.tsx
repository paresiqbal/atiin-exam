import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn, resolveUrl } from '@/lib/utils';
import type { NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { url: currentUrl } = usePage();
    const isActive = (
        href?: NavItem['href'],
        mode: 'prefix' | 'exact' = 'prefix',
    ) => {
        if (!href) return false;
        const s = resolveUrl(href);
        if (!s) return false;
        return mode === 'exact' ? currentUrl === s : currentUrl.startsWith(s);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const hasChildren = !!item.items?.length;
                    const groupActive = hasChildren
                        ? item.items!.some((c) => isActive(c.href, 'prefix'))
                        : isActive(item.href, 'prefix');

                    if (!hasChildren) {
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={groupActive}
                                    className="hover:bg-accent data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
                                    tooltip={{ children: item.title }}
                                >
                                    <Link
                                        href={resolveUrl(item.href) || '#'}
                                        prefetch
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    }

                    return (
                        <SidebarMenuItem key={item.title}>
                            <Collapsible defaultOpen={groupActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        className={cn(
                                            'group',
                                            'hover:bg-accent',
                                            'data-[active=true]:bg-accent data-[active=true]:text-accent-foreground',
                                            'data-[state=open]:bg-accent/60',
                                        )}
                                        isActive={groupActive}
                                        tooltip={{ children: item.title }}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight
                                            className={cn(
                                                'ml-auto h-4 w-4 transition-transform duration-200',
                                                'group-data-[state=open]:rotate-90',
                                            )}
                                        />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items!.map((sub) => (
                                            <SidebarMenuSubItem key={sub.title}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isActive(
                                                        sub.href,
                                                        'exact',
                                                    )}
                                                    className="hover:bg-accent/60 data-[active=true]:bg-accent/80 data-[active=true]:text-accent-foreground"
                                                >
                                                    <Link
                                                        href={resolveUrl(
                                                            sub.href,
                                                        )}
                                                        prefetch
                                                    >
                                                        <span>{sub.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

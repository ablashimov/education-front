import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/components/ui/utils';

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              style={
              {
                width: '50px',
                height: '50px',
              }
              }
              variant="outline"
              // size="icon"
              className="relative bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              <div className={"button-bell"}>
                <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.48149 9.07777C6.39886 5.86945 8.89127 3 12.1007 3V3C15.24 3 17.656 5.74275 17.5341 8.87969C17.5127 9.42969 17.5 9.97677 17.5 10.5C17.5 13.7812 21 18 21 18H3C3 18 6.5 14.7188 6.5 10.5C6.5 10.0122 6.49331 9.5369 6.48149 9.07777Z" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 21C10.4886 21.6132 11.2035 22 12 22C12.7965 22 13.5114 21.6132 14 21" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/*<Bell style={*/}
              {/*  {width:100}*/}
              {/*}  className="h-5 w-5" />*/}
              {/**/}
              {unreadCount > 0 && (
                <div
                  className="button-bell-count"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs h-auto py-1">
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                                        !notification.read_at && "bg-muted/20"
                                    )}
                                    onClick={() => {
                                        if (!notification.read_at) markAsRead(notification.id);
                                        if (notification.data.link) window.location.href = notification.data.link;
                                    }}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !notification.read_at && "font-bold")}>
                                                {notification.data.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {notification.data.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.read_at && (
                                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

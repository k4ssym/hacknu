import { useMemo, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   body?: string;
 *   category?: string;       // e.g., "System", "Projects", "Security"
 *   createdAt: string;       // ISO date string
 *   createdAtLabel?: string; // optional preformatted label
 *   read?: boolean;
 *   avatarUrl?: string;      // optional user/avatar image
 *   severity?: "info" | "warning" | "critical"; // optional for dot color
 * }} Notification
 */

/**
 * Notification dropdown without mock items.
 * Pass your real notifications as a prop.
 */
export default function NotificationDropdown({
  notifications = [],
}: {
  notifications?: Array<any>; // use your own Notification type if using TS
}) {
  const [isOpen, setIsOpen] = useState(false);

  const hasUnread = useMemo(
    () => notifications.some((n: any) => !n?.read),
    [notifications]
  );

  // Controls the orange dot until user opens the dropdown.
  const [notifying, setNotifying] = useState(hasUnread);

  function toggleDropdown() {
    setIsOpen((v) => !v);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  const dotColorFor = (n: any) => {
    if (n?.severity === "critical") return "#ff671b";
    if (n?.severity === "warning") return "#ff671b";
    return "#8db92e"; // "info" / default
  };

  const formatWhen = (iso?: string, fallback?: string) => {
    if (fallback) return fallback;
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
        aria-label="Open notifications"
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-[#ff671b] ${
            notifying && hasUnread ? "flex" : "hidden"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-[#ff671b] rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 12 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            ZAMAN.AI Notifications
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label="Close notifications"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <li className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              You’re all caught up. No notifications.
            </li>
          ) : (
            notifications.map((n: any) => (
              <li key={n.id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    {n.avatarUrl ? (
                      <img
                        width={40}
                        height={40}
                        src={n.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover overflow-hidden rounded-full"
                      />
                    ) : (
                      <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs">
                        {n.title?.slice(0, 2)?.toUpperCase() ?? "NZ"}
                      </span>
                    )}
                    <span
                      className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900"
                      style={{ backgroundColor: dotColorFor(n) }}
                    />
                  </span>

                  <span className="block">
                    <span className="mb-1.5 block text-theme-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-white/90">
                        {n.title}
                      </span>
                      {n.body ? (
                        <>
                          <span className="mx-1">—</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {n.body}
                          </span>
                        </>
                      ) : null}
                    </span>

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      {n.category ? <span>{n.category}</span> : null}
                      {n.category ? (
                        <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      ) : null}
                      <span>{formatWhen(n.createdAt, n.createdAtLabel)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>

        <Link
          to="/notifications"
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-white bg-[#ff671b] border border-[#ff671b] rounded-lg hover:bg-[#e05c17] dark:border-[#ff671b] dark:bg-[#ff671b] dark:hover:bg-[#e05c17]"
        >
          View All Notifications
        </Link>
      </Dropdown>
    </div>
  );
}

import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import UserTable from "../components/tables/BasicTables/UserTable";

export default function Blank() {
  return (
    <div>
      <PageMeta
        title="ZAMAN.AI ML"
        description="ZAMAN.AI ML"
      />
      <PageBreadcrumb pageTitle="User Dashboard" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Centered welcome message */}
        {/* User table section */}
        <UserTable />
      </div>
    </div>
  );
}
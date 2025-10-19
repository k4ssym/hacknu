import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import EcommerceCard from "../../components/ecommerce/EcommerceCard";
import NewStatisticsChart from "../../components/ecommerce/NewStatisticsChart";
import ExplanationPDF from "../../components/ecommerce/ExplanationPDF";
export default function Home() {
  return (
    <>
      <PageMeta
        title="ZAMAN.AI ML"
        description="This is React.js ZAMAN.AI ML Dashboard page"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />
                    <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <EcommerceCard />
        </div>



        <div className="col-span-12">
          <NewStatisticsChart />
        </div>


        <div className="col-span-12">
          <RecentOrders />
        </div>
                <div className="col-span-12">
          <DemographicCard />
        </div>
      </div>
    </>
  );
}

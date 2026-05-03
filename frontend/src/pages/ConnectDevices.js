import IntegrationStatus from "../components/devices/IntegrationStatus";
import MainDeviceCard from "../components/devices/MainDeviceCard";
import SecondaryDevices from "../components/devices/SecondaryDevices";
import CollectedDataGrid from "../components/devices/CollectedDataGrid";
import SyncQualityCard from "../components/devices/SyncQualityCard";
import RecentActivity from "../components/devices/RecentActivity";
import SecurityFooter from "../components/devices/SecurityFooter";

export default function ConnectDevices() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-bold text-white">Central de Dispositivos</h1>
        <p className="text-zinc-400">
          Seus wearables e fontes biométricas conectadas ao VitalFlow
        </p>
      </div>

      <IntegrationStatus />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <MainDeviceCard />
        <div className="space-y-5">
          <SyncQualityCard />
          <RecentActivity />
        </div>
      </div>

      <SecondaryDevices />

      <CollectedDataGrid />

      <SecurityFooter />
    </div>
  );
}

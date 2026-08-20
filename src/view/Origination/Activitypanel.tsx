import type { ApplicationActivityItem } from './LoanApplicationDetailParts';
import { ActivityFeed } from './LoanApplicationDetailParts';
import { SectionHeading } from '../LoanAccount/LoanView/SharedUI';

export function ActivityPanel({ activity }: { activity: ApplicationActivityItem[] }) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeading title="Activity" aside="Every touchpoint on this application, in order" />
      <ActivityFeed activity={activity} />
    </div>
  );
}
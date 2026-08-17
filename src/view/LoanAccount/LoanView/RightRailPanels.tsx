import { Paper, Text, RingProgress, Avatar, Button } from "@mantine/core";
import { IconMessage, IconNote, IconPhoneCall } from "@tabler/icons-react";
import { brand } from "./SharedUI";

export function RiskSnapshotPanel({ borrower }: { borrower: any }) {
  const creditScore = borrower?.creditScore || 0;
  const kycTone = borrower?.kycStatus === 'Verified' ? brand.teal : borrower?.kycStatus === 'Pending' ? brand.gold : brand.rose;
  const riskTone = borrower?.riskRating === 'Low' ? brand.teal : borrower?.riskRating === 'Medium' ? brand.gold : brand.rose;

  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <div className="flex items-center gap-4 mb-4">
          <RingProgress size={88} thickness={8} sections={[{ value: creditScore / 8.5, color: brand.gold }]} rootColor="#ECE8DD" />
          <div>
            <Text fz={18} fw={700}>{creditScore}</Text>
            <Text fz="sm" c="dimmed">Credit score · {borrower?.riskRating || 'Unknown'} risk</Text>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">KYC status</Text>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: kycTone }} />
              <Text fz="xs" fw={700} c="gray.9">{borrower?.kycStatus || 'Pending'}</Text>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">Risk rating</Text>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: riskTone }} />
              <Text fz="xs" fw={700} c="gray.9">{borrower?.riskRating || 'Unknown'}</Text>
            </span>
          </div>
        </div>
      </Paper>

      {borrower?.relationshipManager && (
        <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
          <Text fz="xs" fw={700} c="gray.9" className="mb-3">Relationship manager</Text>
          <div className="flex items-center gap-3 mb-3">
            <Avatar radius="xl" size={38} style={{ background: `linear-gradient(135deg, ${brand.primary}, ${brand.sky})`, color: '#fff' }}>
              {borrower.relationshipManager.initials}
            </Avatar>
            <div>
              <Text fz="xs" fw={700} c="gray.9">{borrower.relationshipManager.name}</Text>
              <Text fz="xs" c="dimmed">{borrower.relationshipManager.branch}</Text>
            </div>
          </div>
          <Button fullWidth size="xs" variant="light" styles={{ root: { backgroundColor: brand.primarySoft, color: brand.primary } }} leftSection={<IconMessage size={14} />}>
            Message RM
          </Button>
        </Paper>
      )}
    </div>
  );
}

export function DocumentStatusPanel({ checklist }: { checklist: { complete: number; total: number; missingLabel: string | null } }) {
  const pct = checklist.total > 0 ? Math.round((checklist.complete / checklist.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wider mb-3">DOCUMENT STATUS</Text>
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-3" style={{ backgroundColor: brand.slateSoft }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: checklist.missingLabel ? brand.gold : brand.teal }} />
        </div>
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">Complete</Text>
            <Text fz="xs" fw={700} c="gray.9" className="font-mono">{checklist.complete} / {checklist.total}</Text>
          </div>
          <div className="flex justify-between items-center">
            <Text fz="xs" c="dimmed">Missing</Text>
            <Text fz="xs" fw={700} style={{ color: checklist.missingLabel ? brand.gold : undefined }} c={checklist.missingLabel ? undefined : 'gray.9'}>
              {checklist.missingLabel || 'None'}
            </Text>
          </div>
        </div>
        <Button fullWidth size="xs" styles={{ root: { backgroundColor: brand.primary } }} disabled={!checklist.missingLabel}>
          Request from borrower
        </Button>
      </Paper>
    </div>
  );
}

export function QuickLogPanel() {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
      <Paper radius="lg" p="md" style={{ boxShadow: '0 4px 16px rgba(36,31,61,0.07)', border: '1px solid #ECE8DD' }}>
        <Text fz="xs" fw={700} c="gray.5" className="tracking-wider mb-3">QUICK LOG</Text>
        <div className="flex flex-col gap-2">
          <Button fullWidth size="xs" styles={{ root: { backgroundColor: brand.primary } }} leftSection={<IconNote size={14} />}>Add note</Button>
          <Button fullWidth size="xs" variant="light" styles={{ root: { backgroundColor: brand.skySoft, color: brand.sky } }} leftSection={<IconPhoneCall size={14} />}>Log a call</Button>
        </div>
      </Paper>
    </div>
  );
}
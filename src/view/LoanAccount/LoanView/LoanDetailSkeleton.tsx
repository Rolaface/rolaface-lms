import { Paper, Skeleton } from "@mantine/core";

export function LoanDetailSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <Paper
          radius="lg"
          p="md"
          className="border border-[var(--mantine-color-slate-2)]"
        >
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <Skeleton height={28} width="35%" radius="sm" />
              <Skeleton height={12} width="25%" mt={8} radius="sm" />
              <Skeleton height={12} width="30%" mt={8} radius="sm" />
            </div>

            <div className="flex gap-2">
              <Skeleton height={28} width={80} radius="md" />
              <Skeleton height={28} width={60} radius="md" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pb-3 border-b border-[var(--mantine-color-slate-1)]">
            <Skeleton height={42} radius="sm" />
            <Skeleton height={42} radius="sm" />
            <Skeleton height={42} radius="sm" />
            <Skeleton height={42} radius="sm" />
            <Skeleton height={42} radius="sm" />
          </div>

          <Skeleton height={8} mt={16} radius="xl" />
        </Paper>

        <div>
          <div className="flex gap-4 border-b border-[var(--mantine-color-slate-2)] pb-2">
            <Skeleton height={28} width={80} radius="sm" />
            <Skeleton height={28} width={95} radius="sm" />
            <Skeleton height={28} width={80} radius="sm" />
            <Skeleton height={28} width={75} radius="sm" />
            <Skeleton height={28} width={90} radius="sm" />
            <Skeleton height={28} width={80} radius="sm" />
          </div>

          <Paper
            radius="lg"
            p="md"
            mt="md"
            className="border border-[var(--mantine-color-slate-2)]"
          >
            <Skeleton height={20} width="25%" radius="sm" />
            <Skeleton height={12} width="70%" mt={14} radius="sm" />
            <Skeleton height={12} width="60%" mt={8} radius="sm" />

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Skeleton height={70} radius="md" />
              <Skeleton height={70} radius="md" />
              <Skeleton height={70} radius="md" />
              <Skeleton height={70} radius="md" />
            </div>

            <Skeleton height={120} mt={16} radius="md" />
          </Paper>
        </div>
      </div>

      <div className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4">
        <Paper
          radius="lg"
          p="md"
          className="border border-[var(--mantine-color-slate-2)]"
        >
          <Skeleton height={18} width="45%" radius="sm" />
          <Skeleton height={55} mt={16} radius="md" />
          <Skeleton height={12} width="70%" mt={12} radius="sm" />
          <Skeleton height={12} width="55%" mt={8} radius="sm" />
        </Paper>

        <Paper
          radius="lg"
          p="md"
          className="border border-[var(--mantine-color-slate-2)]"
        >
          <Skeleton height={18} width="40%" radius="sm" />
          <Skeleton height={45} mt={16} radius="md" />
          <Skeleton height={45} mt={10} radius="md" />
          <Skeleton height={45} mt={10} radius="md" />
        </Paper>
      </div>
    </div>
  );
}
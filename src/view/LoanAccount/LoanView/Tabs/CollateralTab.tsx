import { Paper, Text, Badge, Group, Progress, Pagination } from "@mantine/core";

export function CollateralTab({ data, meta, page, setPage, onPaginate, renderCurrency }: any) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.map((assignment: any) => (
          <Paper key={assignment.name} radius="lg" className="overflow-hidden" style={{ border: "1px solid var(--mantine-color-slate-2)", boxShadow: "var(--mantine-shadow-sm)" }}>
            <div className="flex justify-between p-4 border-b border-[var(--mantine-color-slate-1)] bg-[var(--mantine-color-slate-0)]">
              <div>
                <Text fw={700}>{assignment.name}</Text>
                <Text fz="xs" c="dimmed">Applicant: {assignment.applicant}</Text>
              </div>
              <Badge color={assignment.status === "Approved" ? "teal" : "orange"} variant="light">
                {assignment.status}
              </Badge>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <Text fz="xs" c="dimmed">Total Security Value</Text>
                  <Text fz="sm" fw={600}>{renderCurrency(assignment.total_security_value)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text fz="xs" c="dimmed">Max Loan Value (Post Haircut)</Text>
                  <Text fz="sm" fw={600}>{renderCurrency(assignment.maximum_loan_value)}</Text>
                </div>
              </div>

              {assignment.items?.map((item: any) => (
                <div key={item.loan_security} className="border-t border-[var(--mantine-color-slate-1)] pt-3 mt-3">
                  <Text fz="sm" fw={600}>{item.loan_security_name}</Text>
                  <Text fz="xs" c="dimmed" mb="xs">{item.loan_security_type} · Qty: {item.qty}</Text>
                  
                  <div className="flex justify-between mb-1">
                    <Text fz="xs">Market Value</Text>
                    <Text fz="xs">{renderCurrency(item.amount)}</Text>
                  </div>
                  <Progress value={100} color="dark" radius="xl" size="sm" mb="sm" />

                  <div className="flex justify-between mb-1">
                    <Text fz="xs">Post-Haircut Value ({item.haircut_percent}%)</Text>
                    <Text fz="xs">{renderCurrency(item.post_haircut_amount)}</Text>
                  </div>
                  <Progress value={(item.post_haircut_amount / item.amount) * 100} color="slate" radius="xl" size="sm" />
                </div>
              ))}
            </div>
          </Paper>
        ))}
      </div>
      {data.length === 0 && <Text fz="xs" c="dimmed" className="text-center py-4">No collateral assigned.</Text>}
      {meta && meta.total_pages > 1 && (
        <Group justify="flex-end">
          <Pagination value={page} onChange={(v) => { setPage(v); onPaginate(v); }} total={meta.total_pages} size="sm" color="brand" radius="md" />
        </Group>
      )}
    </div>
  );
}
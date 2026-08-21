import { Text } from '@mantine/core';
import type { ApplicationDocument } from './LoanApplicationDetailParts';
import { DocumentCard } from './LoanApplicationDetailParts';
import { SectionHeading } from '../LoanAccount/LoanView/SharedUI';

export function DocumentsPanel({ documents }: { documents: ApplicationDocument[] }) {
  const uploaded = documents.filter((d) => d.status === 'Uploaded').length;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading title="Documents" aside={`${uploaded} / ${documents.length} shown`} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
        {documents.length === 0 && (
          <Text fz="xs" c="dimmed">
            No documents match your search.
          </Text>
        )}
      </div>
    </div>
  );
}
import { Text } from '@mantine/core';
import { useCompanyStore } from '../../store/companyStore';
import { getSymbol } from '../../store/currencyStore';

export function CurrencySymbol({
  size = 'sm',
  fw = 700,
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fw?: number;
}) {
  const baseCurrency = useCompanyStore((state) => state.baseCurrency);

  return (
    <Text component="span" size={size} fw={fw}>
      {getSymbol(baseCurrency)}
    </Text>
  );
}
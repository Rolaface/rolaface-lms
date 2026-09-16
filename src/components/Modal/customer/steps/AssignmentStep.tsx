import { useEffect, useState } from "react";

import { Select, Stack, Text, Grid } from "@mantine/core";

import { IconChevronDown, IconUserCog } from "@tabler/icons-react";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import {
  PlainCard,
  SectionHeader,
} from "../../../../components/shared/customer/Shared";

import {
  fetchRelationshipManagers,
  type UserOption,
} from "../../../../api/utils/frappeUtilsApi";

interface AssignmentStepProps {
  relationshipManager: string | null;
  setRelationshipManager: (v: string | null) => void;
}

const chevron = (
  <IconChevronDown
    size={13}
    color="var(--mantine-color-slate-4)"
  />
);

export function AssignmentStep({
  relationshipManager,
  setRelationshipManager,
}: AssignmentStepProps) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [selectedRmData, setSelectedRmData] = useState<UserOption | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const {
    data: relationshipManagersData,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["relationshipManagers", search],
    queryFn: () => fetchRelationshipManagers(search || undefined),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const relationshipManagers = Array.isArray(relationshipManagersData)
    ? relationshipManagersData
    : [];

  const rmOptions = relationshipManagers.map((user) => ({
    value: user.name,
    label: user.name,
  }));


  const { data: selectedRmLookupData } = useQuery({
    queryKey: ["relationshipManagerLookup", relationshipManager],
    queryFn: () => fetchRelationshipManagers(relationshipManager ?? undefined),
    enabled: !!relationshipManager && !selectedRmData,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!relationshipManager) {
      setSelectedRmData(null);
      return;
    }
    if (selectedRmData?.name === relationshipManager) return;

    const fromMainList = relationshipManagers.find(
      (user) =>
        user.name === relationshipManager ||
        user.email === relationshipManager,
    );
    if (fromMainList) {
      setSelectedRmData(fromMainList);
      return;
    }

    const fromLookup = selectedRmLookupData?.find(
      (user) =>
        user.name === relationshipManager ||
        user.email === relationshipManager,
    );
    if (fromLookup) {
      setSelectedRmData(fromLookup);
    }
  }, [relationshipManager, relationshipManagers, selectedRmLookupData, selectedRmData]);

  const handleChange = (value: string | null) => {
    setRelationshipManager(value);

    if (value) {
      const match = relationshipManagers.find((user) => user.name === value);
      if (match) {
        setSelectedRmData(match);
      }
    } else {
      setSelectedRmData(null);
    }

    setSearchInput("");
  };

  const rmName = selectedRmData?.full_name ?? "";

  return (
    <PlainCard dense>
      <SectionHeader
        icon={IconUserCog}
        title="Assignment"
        dense
      />

      <Grid gap="sm" mt="xs">
        <Grid.Col span={4}>
          <Select
            radius="md"
            searchable
            clearable
            rightSection={chevron}
            label="Relationship Manager ID"
            placeholder={
              isLoading
                ? "Loading relationship managers..."
                : "Select RM"
            }
            data={rmOptions}
            filter={({ options }) => options}
            value={relationshipManager}
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onChange={handleChange}
            disabled={isLoading}
            nothingFoundMessage={
              isFetching
                ? "Searching..."
                : "No relationship managers found"
            }
          />
        </Grid.Col>

        <Grid.Col span={4}>
          <Stack gap={2}>
            <Text
              size="xs"
              fw={600}
              c="slate.6"
            >
              Relationship Manager Name
            </Text>

            <Text
              size="sm"
              fw={500}
              c={rmName ? "slate.8" : "slate.4"}
              py={8}
              px={12}
              style={{
                border: "1px solid var(--mantine-color-slate-2)",
                borderRadius: "var(--mantine-radius-md)",
                background: "var(--mantine-color-slate-0)",
                minHeight: 36,
              }}
            >
              {rmName || "Auto-filled"}
            </Text>
          </Stack>
        </Grid.Col>
      </Grid>
    </PlainCard>
  );
}
# Decision Log 2026-06-27

## D1: Use sougaku ZIP as primary processed data and Mizuho CSV as verification for this refresh

- Context: The project already treats sougaku ZIP as the full-history normalized processed source and Mizuho official CSV as the recent official verification source.
- Decision: Keep the existing pipeline. Refresh sougaku ZIP first, parse it into `data/processed`, then regenerate analysis/download CSVs. Use Mizuho official CSV to confirm the latest draw range and key result fields.
- Reasoning: This updates the full-history files consistently without changing data-source semantics or parser behavior during a narrow data-refresh task.
- Tradeoff: Source comparison keeps flagging `salesAmount` differences because sougaku processed rows do not populate that field while Mizuho official rows do.
- Follow-up: If sales amount becomes important for UI or analysis, update the ingestion model intentionally and add tests instead of changing it during a result refresh.

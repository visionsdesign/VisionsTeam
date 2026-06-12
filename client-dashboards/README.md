# Client Dashboards

Standalone, self-contained HTML dashboards for sharing project status with clients.
Each file has its Marker.io data baked in at generation time — just open it in a
browser or host it anywhere (Netlify, S3, email attachment). No build step, no backend.

## Dashboards

| File | Project | Source |
| ---- | ------- | ------ |
| `potentially-investor.html` | Potentially (Investor site) | Marker.io project `Potentially Investor` |

## Refreshing

These are **snapshots**. The data is pulled live from Marker.io via the connected MCP
at generation time and embedded into the `ISSUES` array inside each file. To refresh,
re-pull the project's issues from Marker.io and regenerate the file.

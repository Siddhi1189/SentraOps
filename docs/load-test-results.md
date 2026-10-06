# SentraOps Ingest API Load Test Results

## 1. Machine Specifications

- **Operating System:** Microsoft Windows 11 Home Single Language, Version 10.0.26200
- **Processor (CPU):** AMD Ryzen 7 260 w/ Radeon 780M (8 Cores, 16 Logical Processors)
- **Memory (RAM):** 24,259,764 KB (~24 GB total physical RAM)

## 2. Test Execution Command

The test was executed using the official `grafana/k6:latest` container against the local SentraOps API:

```bash
docker run --rm \
  -v "${PWD}/tests/load:/scripts" \
  -e TARGET_URL=http://host.docker.internal:4000/api/ingest/events \
  -e API_KEY=sops_loadtestkey1234567890abcdefghijklmnopqrst \
  -e VUS=3 \
  -e DURATION=15s \
  grafana/k6 run /scripts/ingest.js
```

## 3. Raw k6 Summary Output

```
         /\      Grafana   /‾‾/  
    /\  /  \     |\  __   /  /   
   /  \/    \    | |/ /  /   ‾‾\ 
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/ 


     execution: local
        script: /scripts/ingest.js
        output: -

     scenarios: (100.00%) 1 scenario, 3 max VUs, 45s max duration (incl. graceful stop):
              * default: 3 looping VUs for 15s (gracefulStop: 30s)


  █ THRESHOLDS 

    http_req_duration
    ✓ 'p(95)<1000' p(95)=251.89ms


  █ TOTAL RESULTS 

    checks_total.......: 76      4.932227/s
    checks_succeeded...: 100.00% 76 out of 76
    checks_failed......: 0.00%   0 out of 76

    ✓ status is 202
    ✓ has valid eventId

    HTTP
    http_req_duration..............: avg=205.05ms min=148.33ms med=175.96ms max=1.01s p(90)=237.62ms p(95)=251.89ms
      { expected_response:true }...: avg=205.05ms min=148.33ms med=175.96ms max=1.01s p(90)=237.62ms p(95)=251.89ms
    http_req_failed................: 0.00% 0 out of 38
    http_reqs......................: 38    2.466114/s

    EXECUTION
    iteration_duration.............: avg=1.2s     min=1.14s    med=1.17s    max=2.02s p(90)=1.24s    p(95)=1.25s   
    iterations.....................: 38    2.466114/s
    vus............................: 3     min=3       max=3
    vus_max........................: 3     min=3       max=3

    NETWORK
    data_received..................: 18 kB 1.1 kB/s
    data_sent......................: 18 kB 1.2 kB/s




running (15.4s), 0/3 VUs, 38 complete and 0 interrupted iterations
default ✓ [ 100% ] 3 VUs  15s
```

## 4. Key Metrics Summary (Exact Values)

- **Total Ingest Requests:** 38
- **Success Rate:** 100.00% (38/38 returned HTTP 202 with valid `eventId`)
- **Failure Rate:** 0.00%
- **Request Duration (Latency):**
  - Average: 205.05ms
  - Median: 175.96ms
  - p90: 237.62ms
  - p95: 251.89ms
  - Minimum: 148.33ms
  - Maximum: 1.01s

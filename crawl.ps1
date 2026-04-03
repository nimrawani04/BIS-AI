$AUTH = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuYnpqZ2lxemRmcGV5dnBpem1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzY4OTcsImV4cCI6MjA5MDgxMjg5N30.bFunH3KfYg7TrvfUVjJIVA5TJnukTSrM7NNYJy5kMsk"
$ENDPOINT = "https://qnbzjgiqzdfpeyvpizmi.supabase.co/functions/v1/crawl-bis"
$H = @{"Content-Type"="application/json"; "Authorization"=$AUTH}

$batches = @(
  @("Batch1-About+Dirs", @(
    "https://www.bis.gov.in/?lang=en",
    "https://www.bis.gov.in/the-bureau/about-bis/?lang=en",
    "https://www.bis.gov.in/the-bureau/organization-2/?lang=en",
    "https://www.bis.gov.in/the-bureau/origin-of-bis/?lang=en",
    "https://www.bis.gov.in/the-bureau/president/?lang=en",
    "https://www.bis.gov.in/the-bureau/director-general/?lang=en",
    "https://www.bis.gov.in/the-bureau/annual-report/?lang=en",
    "https://www.bis.gov.in/the-bureau/bis-act-rules-and-regulations/?lang=en",
    "https://www.bis.gov.in/directory/enquiry/?lang=en",
    "https://www.bis.gov.in/directory/head-quarter/?lang=en",
    "https://www.bis.gov.in/directory/regional-offices/?lang=en",
    "https://www.bis.gov.in/directory/branch-office/?lang=en",
    "https://www.bis.gov.in/directory/sales-office/?lang=en",
    "https://www.bis.gov.in/directory/laboratory/?lang=en",
    "https://www.bis.gov.in/full-faq/?lang=en",
    "https://www.bis.gov.in/whats-new/?lang=en"
  )),
  @("Batch2-ProductCert+Systems+FMCS", @(
    "https://www.bis.gov.in/product-certification/product-certification-overview/?lang=en",
    "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/?lang=en",
    "https://www.bis.gov.in/product-certification/product-certification-process/?lang=en",
    "https://www.bis.gov.in/product-certification/product-specific-information-2/?lang=en",
    "https://www.bis.gov.in/product-certification/product-certification-fee/?lang=en",
    "https://www.bis.gov.in/product-certification/product-certificatin-apply-online/?lang=en",
    "https://www.bis.gov.in/product-certification/product-certification-faq/?lang=en",
    "https://www.bis.gov.in/product-certification/product-certification-contact-us/?lang=en",
    "https://www.bis.gov.in/system-certification-overview/?lang=en",
    "https://www.bis.gov.in/system-certification-overview/systems-certification/?lang=en",
    "https://www.bis.gov.in/system-certification-overview/certification-process/systems-under-certification/?lang=en",
    "https://www.bis.gov.in/system-certification-overview/certification-process/who-can-apply/?lang=en",
    "https://www.bis.gov.in/system-certification-overview/certification-process/fee-structure-for-mscs/?lang=en",
    "https://www.bis.gov.in/system-certification-overview/system-certification-faq/?lang=en",
    "https://www.bis.gov.in/system-certification-overview/system-certification-contact-us/?lang=en",
    "https://www.bis.gov.in/fmcs/fmcs-overview/?lang=en"
  )),
  @("Batch3-FMCS+CRS+SchemeX+Labs", @(
    "https://www.bis.gov.in/fmcs/certification-process/aboutfmcs/?lang=en",
    "https://www.bis.gov.in/fmcs/certification-process/products-under-fmcs/?lang=en",
    "https://www.bis.gov.in/fmcs/certification-process/who-can-apply/?lang=en",
    "https://www.bis.gov.in/fmcs/certification-process/how-to-apply/?lang=en",
    "https://www.bis.gov.in/fmcs/certification-process/grant-of-licence/?lang=en",
    "https://www.bis.gov.in/fmcs/fmcs-laboratories/?lang=en",
    "https://www.bis.gov.in/fmcs/fmcs-fee/?lang=en",
    "https://www.bis.gov.in/fmcs/fmcs-faqs/?lang=en",
    "https://www.bis.gov.in/fmcs/fmcs-contact-us/?lang=en",
    "https://www.crsbis.in/BIS/about-crs.do",
    "https://www.crsbis.in/BIS/registration-page.do",
    "https://www.crsbis.in/BIS/faq-bis.do",
    "https://www.crsbis.in/BIS/contact.do",
    "https://www.bis.gov.in/products-under-compulsory-certification-scheme-x/",
    "https://www.bis.gov.in/scheme-x-certification/faq-scheme-x-certification/",
    "https://www.bis.gov.in/laboratorys/laboratory-services-overview/?lang=en"
  )),
  @("Batch4-Labs+Hallmarking", @(
    "https://www.bis.gov.in/laboratorys/testing-facility-and-testing-charges/?lang=en",
    "https://www.bis.gov.in/laboratorys/list-of-bis-recognized-lab/?lang=en",
    "https://www.bis.gov.in/laboratorys/laboratory-services-overview/laboratory-faq/?lang=en",
    "https://www.bis.gov.in/laboratorys/testing-overview/laboratory-contact-us/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/hallmarking-regulation-2018/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/mandatory-hallmarking-order/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/jewellers-registration-scheme/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/hallmarking-centre/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/gold-refinery/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/consumer-protection/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/hallmarking-faqs/hallmarking-faq/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/hallmarking-faqs/mandatory/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/hallmarking-contact-us/?lang=en",
    "https://www.bis.gov.in/hallmarking-jewellers/?lang=en",
    "https://www.bis.gov.in/hallmarking-overview/hallmarking-faqs/bis-act-and-regulation-faq/?lang=en"
  )),
  @("Batch5-Training+Consumer+News", @(
    "https://www.bis.gov.in/training-2/overview-of-nits/?lang=en",
    "https://www.bis.gov.in/training-2/procedure-for-applying-for-a-training-programme/?lang=en",
    "https://www.bis.gov.in/training-2/training-programmes/?lang=en",
    "https://www.bis.gov.in/training-2/training-fee/?lang=en",
    "https://www.bis.gov.in/training-2/training-faq/?lang=en",
    "https://www.bis.gov.in/training-2/training-contact-us/?lang=en",
    "https://www.bis.gov.in/consumer-overview/?lang=en",
    "https://www.bis.gov.in/consumer-overview/consumer-overviews/consumer-protection/?lang=en",
    "https://www.bis.gov.in/consumer-overview/consumer-overviews/online-complaint-registration/?lang=en",
    "https://www.bis.gov.in/consumer-overview/consumer-overviews/citizen-charter/?lang=en",
    "https://www.bis.gov.in/enforcement-activities/?lang=en",
    "https://www.bis.gov.in/consumer-overview/consumer-overviews/for-consumers-faq/?lang=en",
    "https://www.bis.gov.in/consumer-overview/consumer-overviews/for-consumers-contact-us/?lang=en",
    "https://www.bis.gov.in/upcoming-qcos-notified-and-due-for-implementation/",
    "https://www.bis.gov.in/public-alert-for-product-recall-on-account-of-non-conformity-of-product/",
    "https://www.bis.gov.in/career-opportunities/?lang=en"
  ))
)

$totalChunks = 0
$batchNum = 0

foreach ($batch in $batches) {
  $batchNum++
  $batchName = $batch[0]
  $urls = $batch[1]
  Write-Host ""
  Write-Host "=== $batchName ($($urls.Count) URLs) ===" -ForegroundColor Cyan

  $body = @{ urls = $urls } | ConvertTo-Json -Compress -Depth 3

  try {
    $r = Invoke-WebRequest -Uri $ENDPOINT -Method POST -Headers $H -Body $body -TimeoutSec 120 -UseBasicParsing
    $data = $r.Content | ConvertFrom-Json
    $totalChunks += $data.total_chunks
    Write-Host "Chunks: $($data.total_chunks) | Pages: $($data.pages_processed)" -ForegroundColor Green
    foreach ($res in $data.results) {
      if ($res.status -eq "success") {
        Write-Host "  [OK] $($res.url) - $($res.chunks) chunks" -ForegroundColor Green
      } elseif ($res.status -eq "skipped") {
        Write-Host "  [--] $($res.url) - $($res.error)" -ForegroundColor Yellow
      } else {
        Write-Host "  [!!] $($res.url) - $($res.error)" -ForegroundColor Red
      }
    }
  } catch {
    Write-Host "BATCH FAILED: $($_.Exception.Message)" -ForegroundColor Red
  }

  if ($batchNum -lt $batches.Count) {
    Write-Host "Waiting 5s..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
  }
}

Write-Host ""
Write-Host "=== CRAWL COMPLETE: $totalChunks total chunks ===" -ForegroundColor Green

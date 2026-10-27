# Migration

Town Meeting on the voter page is published content. It is not a launch deadline.

## Verified

Checked with public DNS, WHOIS, and a request to the live site. Anything not in that set is marked `TBD: confirm`.

- Official site: `https://www.franconianh.gov/`. Apex `https://franconianh.gov/` returns 301 to `https://www.franconianh.gov/`.
- Host: response header `x-host: blu102.sf2p.intern.weebly.net`. Apex `A` is `199.34.228.75` (the address Weebly’s own domain help tells people to use). Shared Weebly password is the known admin model. `TBD: confirm` the Weebly plan name, who pays, and every person who has the password.
- DNS host for `franconianh.gov`: Cloudflare. NS `kirk.ns.cloudflare.com`, `vita.ns.cloudflare.com`. SOA mailbox `dns.cloudflare.com`. `_domainconnect` TXT is `api.cloudflare.com/client/v4/dns/domainconnect`. The web `A` answer is the Weebly address, so that record is not a Cloudflare proxy address. `TBD: confirm` who can log into the Cloudflare zone. Registrar is get.gov; nameservers stay on Cloudflare.
- `franconianh.gov` WHOIS: registrant organization Town of Franconia; registrar get.gov; DNSSEC unsigned; status `serverTransferProhibited`. Registrant email is redacted. Registry expiry is on the WHOIS record; it is not a launch date.
- Mail on `franconianh.gov` (leave these records as they are):
  - `MX` `0 franconianh-gov.mail.protection.outlook.com`
  - `TXT` `v=spf1 include:spf.protection.outlook.com -all`
  - `TXT` `MS=ms32827983`
  - `TXT` `295abb40-89d9-11f1-a71b-7dbda15a7b49` (`TBD: confirm` what this token is; leave it)
  - `_dmarc` `v=DMARC1; p=quarantine; pct=100`
  - `selector1._domainkey` and `selector2._domainkey` CNAMEs to Microsoft DKIM
  - `autodiscover` CNAME `autodiscover.outlook.com`
  - No `AAAA` on the apex. No `mail` / `smtp` / `webmail` hosts. No SIP SRV.
- `www` is CNAME to `franconianh.gov`. `legacy.franconianh.gov` has no record.
- `franconianh.org`: registrar Network Solutions; NS `ns1.worldnic.com`, `ns2.worldnic.com`; `A` `209.17.116.163`; `MX` `0 franconianh-org.mail.protection.outlook.com`; its own Microsoft SPF and `MS=` TXT. `http://franconianh.org/` returns 301 to `http://franconianh.gov/`, then to www, then to https. Registry WHOIS did not return the registrant. `TBD: confirm` who controls the `.org` account and the redirect host. Leave `.org` mail records as they are.
- Weebly documents custom domains (set the site address, then point DNS at the IP shown in Weebly settings) and `*.weebly.com` subdomains. It does not document this site living only at `legacy.franconianh.gov` while apex and www point at GitHub Pages. `TBD: confirm` the plan allows that.
- This repo is `github.com/dzajic/franconia-nh-gov`. Pages origin hardcoded as `https://dzajic.github.io`, project path `/franconia-nh-gov`. Suggest-a-change repo URL is hardcoded in `src/_data/site.js` and `lib/suggest-source.cjs`. Preview workflows take host and base path from `actions/configure-pages`.

## Steps

1. **Town GitHub org, then transfer** — top priority
   - Daniel creates the free GitHub org and does the setup and the repo transfer.
   - Town Administrator’s only task: create a free GitHub account with her town email and accept the org-owner invite (~5 min). Email on the directory row is still obfuscated. `TBD: ask` the address.
   - At least 3 org owners: Daniel, the Town Administrator, and one more (another working-group member or town staff). Require 2FA for every org member.
   - Org contact and billing email is a town address, so the town is the contact of record. `TBD: ask` which mailbox.
   - If an owner leaves, a remaining owner removes them and invites a replacement. The town contact email stays on the org.
   - Informal working group, 2–3 people. Not an official committee. Light Select Board OK. Org name `TBD: ask`.
   - Transfer `dzajic/franconia-nh-gov` into that org.
   - Pages host becomes `https://<org>.github.io/franconia-nh-gov/` until the custom domain is attached.
   - Retarget hardcoded `dzajic` URLs: `src/_data/site.js` (`repo`, `suggestions`), `lib/suggest-source.cjs` (`DEFAULT_REPO`), `README.md` (`dzajic.github.io`, `/franconia-nh-gov`), `IDEAS.md` PR links, `test/suggest-source.test.mjs`.
   - Preview workflows (`.github/workflows/preview.yml`, `deploy.yml`) already read `configure-pages`. After the move, confirm they use the org host. `TBD: confirm` `base_path` is empty once `www.franconianh.gov` is the Pages domain.
   - Done = the repo is in the town org. Until then: no page-owner invites or sign-ups, no Weebly banner, no public preview link. Do not send anyone to `dzajic.github.io`.
2. **Invites, banner, public preview** — depends on step 1
   - Find everyone with the Weebly password. Each becomes a page owner (table below). Invite and sign-up only after step 1.
   - One GitHub issue per page (bodies below). How-to: [How this works](src/suggest/index.md). Owner signs up (free), then one minimal commit via Suggest a change → Edit this page. Fix anything wrong, or add a Last reviewed line. Done = merged commit by the owner.
   - No Last reviewed field on pages yet. Proposed, not added here: a plain line `Last reviewed: YYYY-MM-DD`. The proof commit can add that line, or correct a real error instead.
   - Weebly header notice, pre-launch text. Needs the Weebly login (whoever holds it). Link is the town preview `https://<org>.github.io/franconia-nh-gov/`, not `dzajic.github.io`.
   - That preview is public before go-live. People suggest edits with the Suggest a change modal (Edit this page, Report an issue, or Contact us).
3. **DNS cutover** — depends on step 1
   - Homepage-first: the new site becomes `franconianh.gov`. Pages already in the repo go the same day.
   - Same Weebly login swaps the header notice to the go-live text. The Weebly site is then the old site.
   - A page that is not ready links to the same page on `legacy.franconianh.gov`.
   - Boards posting new minutes: post in both places, or link to legacy minutes until that board moves. Default: link back.
   - Redirect each old Weebly path (`imported_from`, the `*.html` URLs) to the new permalink, or to the matching legacy URL when that page stayed behind.
   - Drop `/cdn-cgi/l/email-protection/`. Replace Cloudflare-obfuscated `email-protection` links with real addresses. `TBD: ask` each address.
   - In GitHub first: verify the domain, set the Pages custom domain to `www.franconianh.gov` (keeps today’s apex → www redirect), enforce HTTPS after the certificate is issued. Publish a `CNAME` file in the site root so the branch deploy keeps the domain.
   - In the existing Cloudflare zone, change only web records. GitHub’s published targets: apex `A` `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; apex `AAAA` `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`; `www` CNAME `<org>.github.io`. Leave the records DNS-only.
   - `legacy` CNAME or `A` to the target Weebly shows after the site address is `legacy.franconianh.gov`. `TBD: confirm` that target and that the plan accepts a subdomain as the site address.
   - Leave every mail record in the Verified list as it is. Leave `.org` DNS and mail as they are. After cutover, confirm `franconianh.org` still lands on the new site.
   - Rollback: put the web records back (`A` `199.34.228.75`, `www` CNAME `franconianh.gov`, remove `legacy` and any GitHub `AAAA`). Mail records stay.
4. **Retire Weebly**
   - When nothing on the new site still links to legacy, remove the `legacy` record and cancel the Weebly contract. `TBD: confirm` who holds the contract.

## Page owners

From `src/_data/bodies.json`, plus the library (homepage department, no body slug). Owner is `TBD`. Invites wait until step 1 is done.

| Name | Kind | Page | Owner |
| --- | --- | --- | --- |
| Board of Selectmen | board | `/board-of-selectmen/` | TBD |
| Town Clerk / Tax Collector | department | `/town-clerk-tax/` | TBD |
| Police Department | department | `/police/` | TBD |
| Fire Department | department | `/fire/` | TBD |
| Highway Department | department | `/highway-dept/` | TBD |
| Water Department | department | `/water/` | TBD |
| Cemetery Trustees | board | `/cemetery/` | TBD |
| Transfer Station | department | `/transfer-station/` | TBD |
| Abbie Greenleaf Library | department | `/abbie-greanleaf-library/` | TBD |
| Planning Board | board | `/planning-board/` | TBD |
| Zoning Board of Adjustment | board | `/zoning-board-of-adjustment/` | TBD |
| Capital Improvements Committee | committee | `/capital-improvements/` | TBD |
| Conservation Commission | board | `/conservation-commission/` | TBD |
| Energy Commission | board | `/energy-commission/` | TBD |
| Recreation Board | board | `/httplafayetterecreationweeblycom/` | TBD |
| Trustees of the Trust Funds | board | `/trustees-of-the-trust-funds/` | TBD |
| Safety Committee | committee | `/safety-committee/` | TBD |
| Supervisors of the Checklist | board | `/supervisors-of-the-checklist/` | TBD |
| Rink Feasibility Committee | committee | `/rink-feasibility-committee/` | TBD |
| Heritage Museum | department | `/heritage-museum/` | TBD |
| Trails & Parks | department | `/trails-parks/` | TBD |
| Town-wide records | town | `/archive/` | TBD |

Archive is not an owner issue. Status, ownership, the header, and the department and board issues are below.

## Weebly header notice

Depends on step 1. Someone with the Weebly login edits the current site header. The pre-launch link is the town org preview, not `dzajic.github.io`. Before go-live the preview is public. People suggest edits with the Suggest a change modal.

Pre-launch (after the transfer, before go-live):

> A new town website is coming. Try the preview and suggest changes: \<link\>.

Go-live (on the Weebly site once it is the old site):

> This is the old site. The new town website is at franconianh.gov.

\<link\> is `https://<org>.github.io/franconia-nh-gov/`.

## Owner issues

One issue per department or board page, plus the status, ownership, and header issues. Page-owner issues open only after the ownership issue is done. How-to: [How this works](src/suggest/index.md).

### Status

Top priority: ownership (town GitHub org and repo transfer). Daniel does the setup and the transfer. The Town Administrator accepts an owner invite.
Blocked on that issue: page-owner invites and sign-ups, the Weebly header notice, and any public preview link.
Those start only after the repo is in the town org. The public preview URL is then `https://<org>.github.io/franconia-nh-gov/`, not `dzajic.github.io`.

### Town GitHub org

Top priority. Called out in the status issue.

Daniel creates the free org, sets 2FA as required for every member, sets the contact and billing email to a town address, and transfers `dzajic/franconia-nh-gov`.
At least 3 owners: Daniel, the Town Administrator, and one more working-group member or town staff.
If an owner leaves, a remaining owner removes them and invites a replacement. The town contact email stays.
Retarget the hardcoded `dzajic` URLs listed in step 1. Org name `TBD: ask`. Town mailbox `TBD: ask`.
Done = the repo is in the town org. Invites, the Weebly banner, and public preview links stay closed until then.

### Town Administrator: accept org owner invite

Label: `town-administrator`

Only task (~5 min): create a free GitHub account with your town email and accept the org-owner invite. Turn on 2FA.
Daniel creates the org and transfers the repo.
Assign once the Town Administrator joins GitHub.

### Weebly header notice

Depends on the ownership issue. Needs the Weebly login. Whoever holds that login does this.
Put the pre-launch line in the current site header. The link is the town preview, not `dzajic.github.io`. Suggest a change on that preview is open to the public. At go-live, switch to the legacy line.
Drafts are under Weebly header notice.

Site: [https://www.franconianh.gov/](https://www.franconianh.gov/)

### Board of Selectmen

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/board-of-selectmen/](src/board-of-selectmen/index.md)

### Town Clerk / Tax Collector

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/town-clerk-tax/](src/town-clerk-tax/index.md)

### Police Department

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/police/](src/police/index.md)

### Fire Department

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/fire/](src/fire/index.md)

### Highway Department

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/highway-dept/](src/highway-dept/index.md)

### Water Department

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/water/](src/water/index.md)

### Cemetery Trustees

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/cemetery/](src/cemetery/index.md)

### Transfer Station

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/transfer-station/](src/transfer-station/index.md)

### Abbie Greenleaf Library

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/abbie-greanleaf-library/](src/abbie-greanleaf-library/index.md)

### Planning Board

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/planning-board/](src/planning-board/index.md)

### Zoning Board of Adjustment

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/zoning-board-of-adjustment/](src/zoning-board-of-adjustment/index.md)

### Capital Improvements Committee

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/capital-improvements/](src/capital-improvements/index.md)

### Conservation Commission

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/conservation-commission/](src/conservation-commission/index.md)

### Energy Commission

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/energy-commission/](src/energy-commission/index.md)

### Recreation Board

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/httplafayetterecreationweeblycom/](src/httplafayetterecreationweeblycom/index.md)

### Trustees of the Trust Funds

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/trustees-of-the-trust-funds/](src/trustees-of-the-trust-funds/index.md)

### Safety Committee

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/safety-committee/](src/safety-committee/index.md)

### Supervisors of the Checklist

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/supervisors-of-the-checklist/](src/supervisors-of-the-checklist/index.md)

### Rink Feasibility Committee

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/rink-feasibility-committee/](src/rink-feasibility-committee/index.md)

### Heritage Museum

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/heritage-museum/](src/heritage-museum/index.md)

### Trails & Parks

After step 1 (town org owns this repo): sign up for GitHub (free).
Suggest a change → Edit this page. One minimal commit that proves you can manage it: fix anything wrong, or add `Last reviewed: YYYY-MM-DD`.
Done = that commit merged, by you.

Page: [/trails-parks/](src/trails-parks/index.md)

## Requirements

Running checklists. Items are already on the live pages or in this repo. Unknowns are `TBD: ask`. These are not the owner issues.

### Town Administrator

Directory lists Elizabeth Staples, Town Office, `603-823-7752`. Email on that row is Cloudflare-obfuscated.

- [ ] Ownership, label `town-administrator`. Only task: free GitHub account with her town email, accept the org-owner invite, turn on 2FA (~5 min). Assign once she joins GitHub.
- [ ] Weebly header notice depends on step 1. Whoever holds the Weebly login posts it. Go-live text when Weebly becomes the old site.

- [ ] Phone `603-823-7752` and Town Office as the administrator contact
- [ ] Real email. `TBD: ask`
- [ ] Administrative Secretary Jenny Monahan, same phone. Email obfuscated. `TBD: ask`
- [ ] Selectmen’s office hours from `/board-of-selectmen/`: closed Monday, Tue–Thu 8:00–4:30, Friday 8:00–1:00
- [ ] Friday close disagrees with the old homepage (1:30). `TBD: ask` which hours to publish
- [ ] Directory rows: Police Chief Mac Cashin, Fire Chief Rick Gaudette, Road Agent Jeremy Hall, Building Inspector Dave Wiley. Emails obfuscated. `TBD: ask` each address
- [ ] Building inspector has a directory row and no department page. Permits live on `/forms-applications/`. `TBD: ask` who owns that page
- [ ] Forms on that page: certificate of occupancy, building checklist and fees, building permit, single-family sewer, commercial/multi-unit sewer, driveway, solar, demolition, generator, sign, volunteer, facilities use, facilities fee schedule, short-term rental, link to Planning Board forms
- [ ] Homepage forms (`src/_data/forms.json`): building, driveway, solar, demolition, generator, short-term rental, facilities use, volunteer. Those PDFs are still `franconianh.gov/uploads/...`
- [ ] Notices: 2026 candidate-filing list, budget hearing (Monday, February 2, 2026, 6:00 p.m., Lafayette Elementary School, 149 Main Street), Supervisors session (Saturday, February 28, 2026, 2:00–2:30 p.m., Town Hall). `TBD: ask` which notices are still current
- [ ] Voter page: Town Meeting March 10, 2026, polls 1:00–7:00 p.m., meeting 7:05 p.m., Lafayette Regional School; absentee link `app.sos.nh.gov`; sample ballots
- [ ] About page: next Town Meeting date is still `[town meeting date]`. `TBD: ask`
- [ ] Budgets page: proposed budgets, warrants, MS-636, hearing slideshows, 2024 financial report, 2022 audit (Plodzik & Sanderson) and governance letter, MS-535 / MS-232 / MS-434, 2021 cyclical revaluation
- [ ] Assessing: Avitar portal, 2016 assessment manual PDF, municipal abatement form (`nh.gov/btla`)
- [ ] Ordinances page is three placeholders (zoning, road, other). `TBD: ask` what to publish
- [ ] `/public-works/` and `/safety-services/` are empty imports. `TBD: ask` whether they stay
- [ ] `/meetings/` rows are labeled PDF placeholders. `TBD: ask` before they show as real meetings
- [ ] Homepage tasks: pay taxes / register vehicle, permits and forms, agendas and minutes, trash and transfer station, contact the clerk (`townclerk@franconianh.gov`, `603-823-5237`)
- [ ] Homepage departments: clerk, selectmen, police, fire, highway, water, cemetery, transfer station, library, with the phones and hours in `departments.json`
- [ ] Latest-minutes strip is only selectboard, planning board, conservation, energy (`home.json`). Other boards follow the link-back default
- [ ] One onboarding issue per department/board page (bodies above). Open them only after step 1. Done = merged commit by that owner. How-to: [How this works](src/suggest/index.md)
- [ ] Mail records in the Verified list unchanged after cutover
- [ ] `franconianh.org` still redirects to the site, and its MX stays
- [ ] Preview bar (`site.previewNotice`) off when this is the official site
- [ ] Suggestions address is `energy-commission+suggestions@mail.grokbot.com`, labeled Technology Committee (TBD). Working group is not that committee. `TBD: ask` the real address
- [ ] Archive files are not in git. Links use `ARCHIVE_BASE_URL` (placeholder `archive.example.invalid`). `TBD: ask` where files will live
- [ ] Bracketed unknowns stay bracketed until someone supplies the value (`[population]`, `[email]`, `[hours]`, `[school details]`, `[schedule]`)

### Select Board

- [ ] Office phone `603-823-7752`, hours above, real email. `TBD: ask` the address (page email is obfuscated)
- [ ] Roster conflict. Selectmen page: Eric Meth 2028, Jill Brewer 2026 Chair, Dan Walker 2027. About page: Dan Walker Chair term 2027, Eric Meth 2028, Eugene Leeds 2029. `TBD: ask` which roster to publish
- [ ] Agendas and minutes via `/bos-minutes/` until the archive holds them. New minutes: link back to legacy until this board migrates (or post both)
- [ ] Assessing links: Avitar portal, 2016 manual, abatement form
- [ ] Same people appear elsewhere: Eric Meth on Planning Board and Energy Commission; Jill Brewer as BOS representative on Conservation; Dan Walker as BOS representative on Capital Improvements. `TBD: ask` which of those seats are current

### Town Clerk / Tax Collector

- [ ] Carol Wills. Phone `603-823-5237`. Email `townclerk@franconianh.gov`. Address 421 Main Street, PO Box 900, Franconia, NH 03580
- [ ] Directory also lists fax `603-823-5581`. `TBD: ask` whether to publish the fax
- [ ] Hours on the clerk page: Monday closed, Tue–Thu 8:00 a.m.–4:00 p.m., Friday 8:00 a.m.–12:00 p.m.
- [ ] Notices and the voter page say Friday clerk hours 8:00–1:00, plus Friday, January 30, 3–5 p.m. for candidacy only. `TBD: ask` which Friday hours to publish
- [ ] Online: pay taxes and fees `pay.eb2gov.com/FranconiaNH`; vehicle registration `ERegistration/884`; dog licensing `DogLicensing/885`; vital records `VitalRecordRequest/886`; tax kiosk `franconia.nhtaxkiosk.com`; Avitar assessing
- [ ] Page still lists “Vehicle registration (placeholder)” and “Tax bills and payments (placeholder)” beside those live links. `TBD: ask` which to keep
- [ ] `/dog-licensing/`: license by April 30, 2024; fees $10 / $7.50 / $2.00 (owner over 65) / $7.50 (puppies); $25 penalty cited to June 1, 2019 and RSA 466:13; rabies certificate; application `.docx`. `TBD: ask` current fees and dates
- [ ] That same page also links birth, death, marriage, and divorce certificate applications
- [ ] Candidate filing list and Town Meeting block as on the voter page
- [ ] Absentee ballot request via the Secretary of State
- [ ] Link to Lafayette Recreation (`lafayetterecreation.weebly.com`). `TBD: ask` whether that stays a separate site

### Police Department

- [ ] Emergency 911. Dispatch `823-8123`. Station `823-7025`. Mailing address P.O. Box 900, Franconia, NH 03580
- [ ] Email obfuscated. Directory lists Chief Mac Cashin and cell `603-728-8020`. Page lists Chief Martin A Cashin. `TBD: ask` the published name, cell, and email
- [ ] Staff table: Sergeant Ryan Jarvis, Justin Barnum, Officer Kerry Pomeroy, Officer Zachary Bushway, Officer Jeff Dube, Lorie Aldrich (office administrator)
- [ ] Vision statement and the voluntary written-statement link
- [ ] New minutes, if any: link back to legacy until this department migrates (or post both)

### Fire Department

- [ ] Emergency 911. Station `(603) 823-8821`
- [ ] Page: Chief Tyler Gaudette, Asst. Chief Rick Gaudette, Deputy Warden Kim Cowles. Directory: Fire Chief Rick Gaudette. `TBD: ask` which roster to publish. Chief email obfuscated
- [ ] Links: NH Forest & Lands fire, online burn permit, equipment, water supply, FFD history 1933–2020, 2018 school fire-prevention piece
- [ ] Volunteer-firefighter ask, winter safety notes, extinguisher guidance (P.A.S.S.)
- [ ] New minutes: link back to legacy until this department migrates (or post both)

### Highway Department

- [ ] Road agent Jeremy Hall. Page phone `603-616-9308` (also `departments.json`). Directory lists cell `603-991-9758` and no office phone. `TBD: ask` which number to publish
- [ ] Email obfuscated. `TBD: ask`
- [ ] New minutes: link back to legacy until this department migrates (or post both)

### Water Department

- [ ] Phone `(603) 823-2049`. Hours Tuesday 11 a.m.–4 p.m., or by appointment
- [ ] Email obfuscated, including the “put me on the agenda” address. `TBD: ask`
- [ ] Commissioners on the water page: Richard Andross 2026, Christopher Harris 2027, Thomas Allen 2028. About page lists Harris 2027 and Allen 2028 only. `TBD: ask` the roster
- [ ] Administrator Rachel Pluchino. Winter shutdown / bleeder note
- [ ] Meetings: second Thursday, 5:00 p.m., Town Hall (`bodies.json`)
- [ ] Links: 2026 rate hearing, current rates and fees, rules, asset-management PDF, new service, transfer of account, final meter read, 2025 consumer confidence reports (Franconia and Mittersill), minute links 2016–2026
- [ ] New minutes: link back to legacy until this department migrates (or post both)

### Cemetery Trustees

- [ ] Lot purchase or burial: Jayne O’Connor, `603-348-8421`
- [ ] Trustees on the cemetery page: Jayne O’Connor, Mary Brubaker, Chris Collman. Terms are only on the About page (Brubaker 2027, Collman 2028, O’Connor 2029). `TBD: ask` terms
- [ ] Meeting lines include Tuesday, January 10 (no year) and Wednesday, January 11, 2023. `TBD: ask` the current meeting
- [ ] Fee tables: resident and non-resident lots, cremation lot, opening/closing, cremation opening
- [ ] Links: cemetery records, rules and regulations, minutes
- [ ] New minutes: link back to legacy until this board migrates (or post both)

### Transfer Station

- [ ] Hours: Mon and Fri–Sun 9:00–5:00; closed Tue–Thu
- [ ] Bag prices, construction debris, furniture, other charges (brush, CRTs, appliances, tires) as on the page
- [ ] Free recycling of clean paper, cardboard, glass, tin, aluminum. Detail on `/recyclable-items/`
- [ ] No phone on the page. `TBD: ask`
- [ ] Events page credits the Tri-Town Transfer Station Committee (Easton, Sugar Hill, Franconia). `TBD: ask` what belongs on this site versus the other towns
- [ ] Remove the imported `file:///C:/Users/Kim/OneDrive/Desktop/watch.html` link
- [ ] Homepage task “Trash & transfer station” points here

### Abbie Greenleaf Library

- [ ] Phone `(603) 823-8424`. Email obfuscated. `TBD: ask`
- [ ] Hours: Mon and Wed 1:00–5:30 p.m.; Tue and Thu 10:00 a.m.–1:00 p.m.; Fri 12:00–3:00 p.m.; Sat 10:00 a.m.–1:00 p.m.
- [ ] Pointer to `abbielibrary.org` for anything newer
- [ ] Short history (given 1912; National Register July 2003)
- [ ] Library trustees on the About page (Sherburn, Small, Lovett, Cao, Fernandez-Llanio, Richmond, Penney, with the terms printed there). `TBD: ask` if that list is current
- [ ] New minutes: link back to legacy until this board migrates (or post both)

### Planning Board

- [ ] Meetings: second and last Tuesday, 6:00 p.m.
- [ ] Members: Mark Hesler Chair 2027, Thad Presby Vice Chair 2028, Pat Garvin 2028, Monica Laflamme 2027, Eric Meth Selectboard 2028, Stephen Schwartz 2026, John Agostinelli 2026, John DiMarzio Alternate 2026. `TBD: ask` if current
- [ ] Links: minutes, agenda, 2024 master plan, application types (lot line, minor, major 3–10, major over 10, site plan, wireless tower), regulations (zoning, excavation, subdivision, site plan), voluntary lot merger
- [ ] New minutes: link back to legacy until this board migrates (or post both). Sample archive records for this board are already in the repo

### Zoning Board of Adjustment

- [ ] Members: Peter Grote Chair 2025, Tim Klotz 2027, Tim Sykes 2027, Brian Williams 2026, Mark Hesler Planning Board 2027. `TBD: ask` if the 2025 chair line is current
- [ ] Links: meeting minutes, downloadable forms, by-laws
- [ ] New minutes: link back to legacy until this board migrates (or post both)

### Capital Improvements Committee

- [ ] Committee: Steve Plant Chairman, Dan Walker BOS representative, Jan Cole, Danielle Dawson Secretary, Larry Plate, Monica Laflamme Planning Board representative
- [ ] Email obfuscated. `TBD: ask`
- [ ] Page lists 2024 meeting dates at 3:30 p.m. `bodies.json` still says `[schedule]`. `TBD: ask` the current schedule
- [ ] Links: CIP plan 2025–2029, 2024–2025 worksheets, road inventory, minute links 2012–2025
- [ ] New minutes: link back to legacy until this committee migrates (or post both)

### Conservation Commission

- [ ] Members: Chris Nicodemus 2027, Ginny Jeffryes Secretary 2027, Jill Brewer BOS representative 2026, Stephen Schwartz Planning Board, Art Daily 2025, Julie Weisman 2025, Michelle Sauque 2025, Robin Ross alternate, Mary Grote alternate. `TBD: ask` if the 2025 terms are current
- [ ] Mission text on the page
- [ ] Links: parks and trails, 2024 and 2007 natural resources inventories, NH Forest & Lands, Wildlife Action Plan, RSA 36-A:4-a, tri-town water resources, and the minute list on the page
- [ ] New minutes: link back to legacy until this commission migrates (or post both). Homepage already includes this board in latest minutes

### Energy Commission

- [ ] Meetings: third Tuesday, 4:30 p.m., Town Hall; summer meetings under the pavilion at Dow Park
- [ ] Members: Chris Dube 2026 President, David Strange 2027, Daniel Zajic 2027, Bob Tortorice 2025, Eric Meth BOS representative 2025, Charles Lukasik 2026. `TBD: ask` if the 2025 lines are current
- [ ] Charge on the page: 3–10 members, Select Board appoints, 3-year terms; annual energy report
- [ ] Links: Clean Energy NH, 2014 strategic plan, March 2024 report, 2025 report, minute list
- [ ] New minutes: link back to legacy until this commission migrates (or post both). Sample archive records for this commission are already in the repo

### Recreation Board

- [ ] Separate site `lafayetterecreation.weebly.com`, including a minutes page. `TBD: ask` whether launch keeps that site and only links to it
- [ ] Meetings: last Tuesday, 5:15 p.m., Lafayette Regional School, with 24-hour notice of changes on the recreation site
- [ ] Director Katie Raymond, `603-991-1947`, office Tuesday and Thursday 9 a.m.–2 p.m. Email obfuscated. `TBD: ask`
- [ ] Franconia names on the page: Peter Gaudette co-chair, Kristin Wadsworth, Sophia Sherburn. Tri-town members for Sugar Hill, Easton, and the school are on the same page
- [ ] By-laws / tri-town agreement (Google Doc link) and the minute PDFs already linked
- [ ] Repo permalink is `/httplafayetterecreationweeblycom/`. `TBD: ask` the public path if this page moves
- [ ] New minutes: link back to legacy (or the recreation Weebly) until this board migrates (or post both)

### Trustees of the Trust Funds

- [ ] Meetings: third Wednesday, Town Hall
- [ ] Roster conflict. Trustees page: Janice Cole 2026, Carol Walker 2027, Michael Betley 2028. About page: Carol Walker 2027, Michael Betley 2028, Janice Cole 2029. `TBD: ask`
- [ ] Minute links on the page, including the misspelled `public_meting_july_18__1_.docx`
- [ ] New minutes: link back to legacy until this board migrates (or post both)

### Safety Committee

- [ ] Meetings: quarterly, rotating between town buildings
- [ ] All employees are members
- [ ] Links: health and safety manual, employee incident reports, safety procedures, minute list (2013–2018 on the page). `TBD: ask` where newer minutes are
- [ ] New minutes: link back to legacy until this committee migrates (or post both)

### Supervisors of the Checklist

- [ ] Minutes by email. Address obfuscated. `TBD: ask`
- [ ] Roster conflict. Supervisors page: Monica Laflamme 2026, Susan Moore 2028 resigned, Lydia Cumbee completing that term through 2026, Stephen Schwartz 2030. About page: Lydia Cumbee 2028, Stephen Schwartz 2030, Monica Laflamme 2032. `TBD: ask`
- [ ] Notices page session: Saturday, February 28, 2026, 2:00–2:30 p.m., Town Hall (RSA 654:34, 36, 37, 44). `TBD: ask` if that notice stays up
- [ ] New minutes: link back to legacy until this board migrates (or post both)

### Rink Feasibility Committee

- [ ] Two files on the page: minutes 5.23.24 and 6.13.24
- [ ] No members, phone, or meeting schedule. `TBD: ask` whether the committee is still active
- [ ] New minutes: link back to legacy until this committee migrates (or post both)

### Heritage Museum

- [ ] Hours: Saturdays 1:00–4:00 p.m., Memorial Day through Columbus Day; by appointment in that season. Address 553 Main Street. Free
- [ ] 1878 farmhouse, opened 1998, Sarah Nelson Welch collection, almost 10,000 items
- [ ] Current exhibit named on the page: “C.T. Bodwell - Father of the Flume - His Photographic Legacy”
- [ ] Links: `franconiaareaheritage.org`, Facebook
- [ ] Iron furnace interpretive center is maintained by the same volunteers (`/iron-furnace/`). Frost Place season line is on `/frost-place/` (re-opens Memorial Day weekend; `frostplace.org`). Dow clock donations and history are on `/dow-clock/`

### Trails & Parks

- [ ] Email obfuscated. `TBD: ask`
- [ ] Links: Dow Park, Fox Hill Park, Splude’s Place, outdoor recreational plan, landowner-liability statutes, Borderlands, Franconia Area NEMBA
- [ ] No phone or meeting time. `TBD: ask`

### Town-wide records

- [ ] Archive opens the last 12 months by month; older years stay collapsed
- [ ] Records already generated in the repo: Selectboard 2025–2026, plus non-image Planning Board and Energy Commission rows from `data/documents.csv`
- [ ] Other boards’ files stay on the Weebly URLs until that board migrates. Default: link back
- [ ] Each record needs title, date, board, type, and a file location. View links stay placeholders until `ARCHIVE_BASE_URL` is real. `TBD: ask` the store

### Working group

- [ ] At least 3 GitHub org owners: Daniel, the Town Administrator, and one more working-group member or town staff. 2FA required for every org member. Daniel does the setup and the transfer.
- [ ] Light Select Board OK recorded
- [ ] Not an official committee. Contact page and `site.suggestionsContact` still say Technology Committee and use the temporary grokbot address. `TBD: ask` what replaces them
- [ ] Every Weebly-password holder named in the owner table. Invites and sign-ups wait until the ownership issue is done
- [ ] Each page-owner issue closed by a merged commit from that owner. How-to: [How this works](src/suggest/index.md)
- [ ] Suggest a change still offers Edit this page, Report an issue, and Contact us (`/suggest/`)
- [ ] A reviewer approves an edit before it is on the public site
- [ ] PR previews still publish for same-repo pull requests and stay unpublished for forks

### Residents

- [ ] `franconianh.gov` opens the new homepage: five tasks, this-week events, latest minutes, forms, departments, directory
- [ ] Phones that the homepage already prints: clerk `603-823-5237`, selectmen `603-823-7752`, police `603-823-7025`, fire `603-823-8821`, highway `603-616-9308`, water `603-823-2049`, cemetery `603-348-8421`, library `603-823-8424`. Police page also has 911 and dispatch `823-8123`
- [ ] Transfer-station hours and the forms list
- [ ] Search across pages and archive records
- [ ] A page that is not moved yet links to `legacy.franconianh.gov` instead of a dead end
- [ ] Old `*.html` addresses redirect
- [ ] Suggest a change without a staff login: edit, issue, or email
- [ ] Visiting pointer is only the Franconia Notch Chamber of Commerce (`franconianotch.org`). No lodging or hours added for it
- [ ] Official site has no preview banner
- [ ] Town-hall address 421 Main Street, PO Box 900, Franconia, NH 03580
- [ ] About page keeps `[population]`, `[school details]`, and the other brackets until the town fills them

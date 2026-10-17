# Franconia website roadmap

This is the current plan for moving the town website from the live site to this preview. It is not a launch date. The live site stays up until the town decides to switch. The pace follows town staff and the Selectboard.

## Goals

- A reliable town website that is easy to maintain
- Keep all existing public content. Nothing is dropped during the move
- Clearer navigation, readable type, and pages that work on a phone
- Accessibility: people can read and use the site with a keyboard and a screen reader
- The town owns the site, the documents, and the history of changes
- Changes stay visible. Anyone can see what changed, and when

## What this preview already does

The homepage is written for residents. Everyday tasks come first, then what is happening this week and the latest minutes. About is for people who live here or may move here. Visitors looking for lodging, dining, and things to do are sent to the Franconia Notch Chamber of Commerce.

Pages are plain text files (Markdown). Staff edit them on GitHub. A change is reviewed and approved before it is published. The site is rebuilt from those files. A weekly rebuild also runs on its own, so the “last 12 months” list stays current even in a quiet week.

Meeting files (agendas, minutes, and other documents) live in object storage, a simple file store the town controls. This project keeps a short record for each file: title, date, board, type, and where the file lives. The last 12 months are listed by month. Older years stay closed until someone opens them.

Existing town pages keep their current web addresses. If an address has to change, the old address points to the new one.

## How the move works

- Move the content first. The new design carries the existing pages and documents with it
- Keep the current site live until the new one is reviewed and approved
- Avoid downtime. After the switch, the old site stays available as a fallback
- Check accuracy with the boards and departments that own each page
- Leave unknown facts in brackets, such as [hours], until someone confirms them

## Editing and training

Short training for administrators and the people who post updates. The workflow is: edit, preview, review, publish.

Written guides stay with the project for later staff and volunteers:

- Posting meeting minutes
- Updating a page
- Uploading a document and adding its record

## Hosting, backups, and ownership

- The town owns the domain and the hosting
- The project lives in a town-owned GitHub organization, not a personal account
- Hosting stays free or very low cost
- Every change has a version history and can be rolled back
- The town is not locked to one vendor. Pages are plain files, and documents are ordinary files in storage
- Backups: a mirror copy of the project, plus a regular copy of the document store to a town-owned location

## Working group, then a Technology Committee

Start with a small working group of about three to five people: town staff, someone from a board or committee, and technical support. The first job is the move and a review of the design.

Over time that group can become a standing Technology Committee. It would look after the website, help with later digital tools, and keep the knowledge in town.

## Rollout

The order can move faster or slower. A year is a reasonable outer bound.

1. Align with town administration and the Selectboard on goals, ownership, and who approves a change
2. Ask residents for feedback on the homepage, the About page, and the document archive
3. Interview staff about who posts what
4. Pilot with one board: post its agendas and minutes the new way
5. Move the remaining pages and documents
6. Switch the public address only after review, and keep the old site up as a fallback

## Cost and risk

Direct cost stays small because the tools and hosting are free or low cost. The town keeps the content, the project, and the infrastructure. The main risks are a missing login, an unclear owner for a page, or a document that never gets copied into storage. The fallback site and the backups cover a bad publish.

## Open questions

- Who holds the domain name, and who has the login for the current Weebly site?
- Which object storage the town will use, and who can add and remove files
- What to do with the separate Lafayette Recreation site
- How RSA 91-A posting duties map onto who publishes agendas, minutes, and notices

# AMPLIFY! Automation Plan: Meeting Brief

## The recommendation

**Use Microsoft Forms to collect the information, and Power Automate to write it into the Excel knowledge base.** Both come with United Way's Microsoft 365, the knowledge base is already on SharePoint, and there's nothing new to buy or learn.

The flow is: **Form submitted → Power Automate → correct tab in the AMPLIFY Excel knowledge base → dashboard.**

Other options considered:
- **Forms' built-in Excel sync only:** it's free and live, but every form sends responses to its own separate workbook. That recreates the scattered "(Responses).xlsx" files the knowledge base was built to replace, so it works as a backup and not as the whole system.
- **Power Apps or a custom portal:** more expensive and slower to build, with no real benefit at AMPLIFY's volume.
- **Google Forms (current Connect First form):** it lives outside Microsoft 365, so it can't feed the SharePoint Excel file without extra connectors.

## Who fills out what

The main point: **clients enter their own information, and the program lead only adds the parts only she knows.**

| Form | Filled out by | Feeds these knowledge-base tabs |
|---|---|---|
| A. Community Partner Sign-Up | Client | Organizations, People |
| B. Community Support Request (replaces Connect First) | Client | Requests, Community_Investments |
| C. Follow-Up Survey | Client | Outcomes, Systems_Intelligence |
| D. Share Your Story | Client | Stories_Testimonials |
| 2. Engagement and Community Interaction | Program lead | Engagements |
| 4. Community Investment and Funding (approvals and payments) | Program lead | Community_Investments |
| 5. Outcome (confidence score and staff review) | Program lead | Outcomes |
| 6, 7, 8. Systems barriers, projects, events | Program lead | Systems_Intelligence, Projects, Events |

**What the automation does, so Program lead doesn't have to:**
- Creates new Org, Person, Request and other IDs.
- Matches a submission to an organization that's already in the knowledge base.
- Fills in the date, source and verification columns.
- Sends Program lead an alert when a new request comes in.
- Puts unclear matches in a review list instead of guessing.

## Rollout plan

1. **Today:** upload the 4 client forms and the staff forms into Microsoft Forms using Quick Import. Then do the manual clean-up in the Forms editor: required questions, "select all that apply," number and date fields, and the "Other" branching.
2. **This week:** create each form from Excel for the web or SharePoint, and turn on "Open in Excel." That gives every form a live responses workbook right away, so nothing is lost while the automation is being built.
3. **Next 2–4 weeks:** build the Power Automate flows that copy each response into the correct knowledge-base tab. These are already specified in AMPLIFY_Power_Automate_Implementation.xlsx, and this is the dashboard and automation work within the $9,500 budget.
4. **Before going live:** add the missing **Projects** tab to the knowledge base, test each form end to end, then share the client form links through email, a QR code at events, or the website.

## Decisions needed from Program lead

1. Should the Support Request form fully replace the Google Forms Connect First Questionnaire?
2. Who gets new-request alerts, and who approves funding? (The records show approvals by Margaret and by the Advisory group.)
3. Should the client forms be public ("anyone can respond") or limited to people with a link?
4. Should the Follow-Up Survey go out automatically a set number of days after support is given?

## Sources

- [Microsoft Support: Microsoft Forms and Excel workbooks](https://support.microsoft.com/en-us/forms/microsoft-forms-and-excel-workbooks)
- [Microsoft Support: Getting live data in Forms](https://support.microsoft.com/en-us/forms/how-to-get-missing-data-in-forms)
- [Microsoft Q&A: Why Forms responses sometimes don't sync to Excel](https://learn.microsoft.com/en-us/answers/questions/5878495/sometimes-microsoft-form-is-not-reflecting-on-time)

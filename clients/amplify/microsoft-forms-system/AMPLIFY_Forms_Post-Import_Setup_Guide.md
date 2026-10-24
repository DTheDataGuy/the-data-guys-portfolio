# AMPLIFY Community Intelligence: Microsoft Forms Import Package

This package contains **10 separate Word documents**, one per form, built directly from the AMPLIFY Community Intelligence Knowledge Base and the complete Microsoft Forms build specification. Each document is formatted to Microsoft's Quick Import requirements (Title / Heading 1 / Heading 2 paragraph styles, one blank line between questions, no tables or images) so it can be uploaded straight into Microsoft Forms.

Every question, in the exact order specified, from every form in the build package is included, 167 questions total across the 10 forms.

## How to import each form

Microsoft Forms Quick Import only accepts a **file uploaded from your device**, it cannot pull directly from a SharePoint or OneDrive link, so download each `.docx` below first, then:

1. Go to [forms.office.com](https://forms.office.com) and sign in.
2. Select **New Form**, then choose **Quick import from a Word or PDF file** (the "Import your file" dialog you already found).
3. Choose **Upload from this device** and select one of the 10 `.docx` files below.
4. Repeat for each of the 10 files, Forms creates one separate form per document, since Quick Import builds exactly one form per upload.

## The 10 forms

| # | File | Questions | Feeds Excel table | Notes |
|---|------|-----------|--------------------|-------|
| 0 | AMPLIFY_Form_00_AMPLIFY_Community_Intelligence_Form_Directory.docx | 1 | Routing only | Optional landing page, one question that points staff to the correct form below. No knowledge-base write. |
| 1 | AMPLIFY_Form_01_Organization_and_Contact_Intake.docx | 21 | Organizations; People | The **intake form** from your call with DeiMarlon, creates/updates organizations and contacts. |
| 2 | AMPLIFY_Form_02_Engagement_and_Community_Interaction.docx | 22 | Engagements | The **engagement form**, staff/community interactions. |
| 3 | AMPLIFY_Form_03_Community_Request_and_Support_Need.docx | 21 | Requests | Funding and non-funding asks. |
| 4 | AMPLIFY_Form_04_Community_Investment_and_Funding.docx | 22 | Community_Investments | Funding decisions and payments. |
| 5 | AMPLIFY_Form_05_Outcome_and_Community_Learning.docx | 16 | Outcomes | The **follow-up / impact form**, captures what changed after an engagement or investment. |
| 6 | AMPLIFY_Form_06_Systems_Barrier_and_Community_Intelligence.docx | 17 | Systems_Intelligence | Barriers and action opportunities. |
| 7 | AMPLIFY_Form_07_Project_and_Collaboration.docx | 16 | Projects | See gap note below, this table doesn't exist yet in the live workbook. |
| 8 | AMPLIFY_Form_08_Event_and_Participation.docx | 17 | Events | Events, meetings, programs. |
| 9 | AMPLIFY_Form_09_Story_Testimonial_and_Community_Voice.docx | 14 | Stories_Testimonials | Requires documented permission before any public use or "featured" flag. |

**Known gap:** the live "AMPLIFY Community Intelligence Knowledge Base V2.xlsx" you linked does not yet have a `Projects` tab (it has Organizations, People, Engagements, Requests, Community_Investments, Outcomes, Systems_Intelligence, Events, and Stories_Testimonials, but no Projects sheet). Form 7 is built per the official spec, but you or DeiMarlon will need to add a `Projects` tab to the workbook (matching the field list in the build spec) before that form's answers have anywhere to land.

## What Quick Import gets right automatically

- Form title, from the Title-styled line.
- Each question's wording, from the Heading 1 lines.
- Multiple-choice answer options, from the Heading 2 lines under each question.
- Plain open-text questions (any Heading 1 with no Heading 2 options underneath).

## What you still have to set up by hand in Forms after each import

Word/PDF import cannot carry these over, they're Forms-editor settings, not part of the document:

**1. "Select all that apply" toggle.** Import creates every choice question as single-select. Open each of these and turn on "Multiple answers" in the question's format menu:
- Form 1: Q7 Community served
- Form 2: Q14 Community or audience
- Form 4: Q6 Community served
- Form 6: Q6 Community
- Form 7: Q12 Community
- Form 8: Q9 Community

**2. Number / Date field types.** Import lands every question as plain text. Change these to the **Date** or **Number** type in the question's type dropdown (the ones marked "(date)" or "(number only)" in the question text are your reminder):
- Form 2: Q3 Date, Q21 Follow-up due date
- Form 3: Q3 Date requested, Q13 Funding requested (number), Q20 Follow-up due date
- Form 4: Q3 Date or date presented, Q12 Amount requested, Q13 Amount approved, Q14 Amount invested or paid
- Form 5: Q3 Date, Q9 People benefited, Q10 Organizations benefited
- Form 6: Q3 Date
- Form 8: Q3 Date
- Form 9: Q3 Date

**3. "Other" → free-text follow-up branching.** Every "Other" choice below needs a Branching rule (Forms editor → Branching) so selecting "Other" reveals the paired free-text question immediately after it in the same form:
- Form 1: Q7 Community served → Q8 Other community served
- Form 2: Q9 Staff or liaison → Q10 Other staff/liaison name; Q11 Engagement type → Q12 Other engagement type; Q14 Community or audience → Q15 Other community/audience
- Form 3: Q9 Request type → Q10 Other request type
- Form 4: Q6 Community served → Q7 Other community served; Q8 Investment category → Q9 Other investment category
- Form 5: Q6 Outcome category → Q7 Other outcome category
- Form 6: Q6 Community → Q7 Other community; Q8 System area → Q9 Other system area
- Form 7: Q12 Community → Q13 Other community
- Form 8: Q7 Event type → Q8 Other event type; Q9 Community → Q10 Other community
- Form 9: Q6 Story type → Q7 Other story type

**4. Required-question toggles.** Turn on "Required" for the questions the spec marks as required (mainly the routing/match questions at the start of every form, and every narrative/description field, e.g., Form 5's outcome description, Form 6's barrier description, Form 9's quote/story text).

**5. Skip logic.** Beyond the "Other" branching above, several forms also skip whole sections based on an early answer, e.g., Form 1 skips the Contact section entirely when "What are you entering?" = "New organization only"; Form 2/3 skip the org/person lookup questions when "Was an organization involved?" = "No." Rebuild these with Forms' Branching feature using the routing logic already described in the build specification you provided.

**6. Section titles.** To keep the import 100% reliable, section headers were intentionally left out of the uploaded documents (mixing section-title styles into a Quick Import file risks Forms misreading a section title as its own open-text question). Add sections back manually in the Forms editor using **Add new** → **Section** at the same points shown in the build specification (e.g., "Organization Match," "Contact," in Form 1).

## Sources used to confirm the exact import formatting

- [Microsoft Support: Convert a Word or PDF form or quiz to Microsoft Forms](https://support.microsoft.com/en-us/forms/convert-a-word-or-pdf-form-or-quiz-to-microsoft-forms)
- [Microsoft Q&A: How to format Word document to have correct format for MS Forms import](https://learn.microsoft.com/en-us/answers/questions/5496362/how-to-format-word-document-to-have-correct-format)
- [Microsoft Tech Community: MS Forms Quick Import formatting discussion](https://techcommunity.microsoft.com/discussions/microsoftforms/ms-forms-schnellimportquick-import---formatting/3757433)
- [SharePoint Maven: Create a new Microsoft Form by uploading a Word or PDF document](https://sharepointmaven.com/create-a-new-microsoft-form-by-uploading-word-or-pdf-document/)

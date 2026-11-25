# hireReady-AI — When Talent Meets Intelligence

Full-stack career acceleration platform and Play Store / PWA app built with React (Vite, TailwindCSS), Express (TypeScript, Zod), and MongoDB (Mongoose, JSONSchema validation, JWT auth).


## Database & Collections (MongoDB)

Connected to `mongodb://localhost:27017/careerpilot`

### Collections & Schemas:
1. **`users`**:
   - `email`: string (unique, lowercase, trimmed)
   - `passwordHash`: string (bcrypt hashed)
   - `role`: 'user' | 'admin' (default: 'user')
   - `isActive`: boolean (default: true)
   - `emailVerified`: boolean (default: false)
   - `lastLoginAt`: Date | null
   - `createdAt`: Date
   - `updatedAt`: Date

2. **`profiles`**:
   - `user_id`: string (unique, references `users._id`)
   - `role`: 'user' | 'admin'
   - `full_name`: string | null
   - `education`: string | null (e.g. Degree / Program)
   - `college`: string | null
   - `graduation_year`: number | null
   - `skills`: string[] (up to 80 skills)
   - `target_role`: string | null
   - `location`: string | null
   - `phone`: string | null
   - `linkedin`: string | null
   - `website`: string | null
   - `summary`: string | null
   - `daily_minutes`: number (15-480, default: 60)
   - `created_at`: Date
   - `updated_at`: Date

3. **`resumes`**:
   - `user_id`: string (unique, references `users._id`)
   - `content`:
     - `template`: 'classic' | 'modern' | 'minimal'
     - `name`: string
     - `headline`: string
     - `email`: string
     - `phone`: string
     - `location`: string
     - `website`: string
     - `linkedin`: string
     - `summary`: string
     - `skills`: string
     - `achievements`: string
     - `languages`: string
     - `customTitle`: string
     - `customContent`: string
     - `experience`: Array<{ company, role, dates, details }>
     - `education`: Array<{ school, degree, dates }>
     - `projects`: Array<{ name, link, details }>
     - `certifications`: Array<{ name, issuer, date }>
   - `created_at`: Date
   - `updated_at`: Date

4. **`interviewSessions`**:
   - `user_id`: string (references `users._id`)
   - `role`: string (e.g. 'Full Stack Developer', 'Java Developer')
   - `type`: 'hr' | 'technical' | 'behavioral' | 'coding' | 'project'
   - `difficulty`: 'easy' | 'medium' | 'hard'
   - `question_count`: number (1-15)
   - `status`: 'active' | 'completed'
   - `demo`: boolean
   - `messages`: Array<{ role: 'assistant' | 'user', content: string, feedback: object | null, created_at: Date }>
   - `created_at`: Date

5. **`skillAnalyses`**:
   - `user_id`: string (references `users._id`)
   - `target_role`: string
   - `job_description`: string | null
   - `result`: { skills: Array<{ skill, status: 'demonstrated' | 'partial' | 'unverified', evidence, required_level }> }
   - `demo`: boolean
   - `created_at`: Date

6. **`applications`**:
   - `user_id`: string (references `users._id`)
   - `company`: string
   - `title`: string
   - `url`: string | null
   - `status`: 'saved' | 'applied' | 'assessment' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
   - `notes`: string | null
   - `created_at`: Date
   - `updated_at`: Date

7. **`aiUsageLogs`**:
   - `user_id`: string (references `users._id`)
   - `feature`: string
   - `provider`: 'groq' | 'gemini' | 'openrouter' | 'huggingface' | 'openai'
   - `model`: string
   - `created_at`: Date
   - `request_tokens`: number | null
   - `response_tokens`: number | null
   - `latency_ms`: number | null
   - `success`: boolean
   - `error_message`: string | null

8. **`parsed_resumes`**:
   - `user_id`: string (indexed, scoped to user)
   - `original_filename`: string
   - `file_size`: number
   - `mime_type`: string
   - `storage_reference`: string
   - `extracted_text`: string (bounded)
   - `structured_data`: Full extracted JSON schema
   - `parser_version`: string
   - `parsing_status`: 'pending' | 'completed' | 'failed'
   - `is_scanned_pdf`: boolean
   - `extraction_errors`: string[]
   - `created_at`, `updated_at`: Date

9. **`job_targets`**:
   - `user_id`: string (indexed)
   - `target_role`: string
   - `company`: string
   - `industry`: string
   - `job_description`: string
   - `fit_score`: number (0 - 100)
   - `fit_category`: 'Strong Fit' | 'Moderate Fit' | 'Partial Fit' | 'Significant Gap'
   - `score_breakdown`: { skill_score (45%), experience_score (35%), domain_score (20%) }
   - `matched_skills`: string[]
   - `transferable_skills`: Array<{ skill, relevance, transfer_context }>
   - `missing_skills`: Array<{ skill, priority: 'critical' | 'recommended' | 'nice-to-have', reason }>
   - `improvement_plan`: Array<{ phase, topic, actions, resources }>
   - `recommended_roles`: Array<{ role, explanation, match_score }>
   - `career_advice`: string
   - `confidence`: 'high' | 'medium' | 'low'
   - `created_at`: Date

10. **`resume_versions`**:
    - `user_id`: string (indexed)
    - `source_resume_id`: string
    - `version_name`: string
    - `target_role`: string
    - `target_company`: string
    - `company_style`: 'big_tech' | 'enterprise' | 'startup' | 'academic'
    - `original_content`, `tailored_content`: IResumeContent
    - `template_type`: 'modern' | 'executive' | 'minimal' | 'academic' | 'classic'
    - `typography_settings`: { font_family, font_size, accent_color, page_margins, bullet_style, layout_mode }
    - `ats_checklist`: { keyword_coverage, heading_structure, date_consistency, readability, layout_compatibility, overall_readiness }
    - `created_at`, `updated_at`: Date

## Key API Endpoints

- **Resume Parsing & Review**:
  - `POST /api/resume/parse`: Upload PDF/DOCX (multipart/form-data, max 10MB), text extraction, scanned PDF detection, structured AI JSON output.
  - `POST /api/resume/confirm-parsed`: Safe review confirmation; conditionally updates Profile and Resume Builder without silent overwrites.
- **Career Domain Fit**:
  - `POST /api/career/evaluate-fit`: Evaluates candidate against target role/JD using weighted scoring (skills 45%, experience 35%, domain 20%), transferable strengths, missing prerequisites, phased roadmap.
  - `GET /api/career/history`: Retrieves past fit analyses.
  - `GET /api/career/:id`: Retrieves full evaluation details.
- **Resume Tailoring**:
  - `POST /api/resume/generate-tailored`: Tailors resume according to 4 company styles (`big_tech`, `enterprise`, `startup`, `academic`) with XYZ formulas without fabricating credentials; returns structured ATS checklist.
  - `GET /api/resume/versions`: Lists saved tailored resume versions.
  - `GET /api/resume/versions/:id`: Retrieves specific tailored version.
  - `POST /api/resume/versions/:id/restore`: Restores tailored version as user's active resume.
- **PDF Export Pipeline**:
  - `POST /api/resume/export`: Generates selectable-text vector A4 PDF using `pdfkit` with custom fonts, margins, accent colors, and page break management.

## Setup & Running

1. Ensure MongoDB is running locally on `mongodb://localhost:27017/` or MongoDB Atlas URI is set in `server/.env`.
2. Configure `.env` in `server/.env` based on `server/.env.example`.
3. Run the development environment:
   ```bash
   npm run dev
   ```
4. Run full test suite & type checks:
   ```bash
   npm run check
   ```

## Deploy to Vercel and Render

The Vercel and Render configuration files are at the repository root. Push the repository to GitHub, then create a Vercel project and a Render Blueprint from that repository.

### Vercel (frontend)

- Set the project root directory to the repository root. The `vercel.json` file configures the install/build commands, output directory, and client-side routes.
- Add `VITE_API_BASE_URL` as an environment variable, set to the Render API URL (for example, `https://hireready-ai-api.onrender.com`).
- Deploy and copy the assigned Vercel URL.

### Render (API)

- Create the web service from `render.yaml`. Set `MONGODB_URI` to a reachable MongoDB Atlas connection string and `FRONTEND_URL` to the Vercel deployment URL (no trailing slash).
- `JWT_SECRET` is generated by Render. Add `GROQ_API_KEY` if you want to enable Groq-backed AI features.
- Redeploy the API after setting `FRONTEND_URL`, then redeploy the Vercel project if its API URL changes.
- Verify the API is healthy at `https://<render-service>.onrender.com/api/health`.


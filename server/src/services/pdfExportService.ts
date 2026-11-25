import PDFDocument from "pdfkit";
import { IResumeContent } from "../models/Resume";

export interface IPdfExportOptions {
  fontFamily?: "Inter" | "Roboto" | "Merriweather" | "JetBrains Mono" | "Lato";
  fontSize?: "small" | "regular" | "large";
  accentColor?: string;
  marginOption?: "compact" | "normal" | "spacious";
  bulletStyle?: "disc" | "dash" | "arrow" | "square";
  template?: "classic" | "modern" | "minimal" | "executive" | "academic";
}

/**
 * Generate a clean, selectable-text vector PDF buffer using pdfkit.
 */
export function generateResumePdfBuffer(
  resume: IResumeContent,
  options: IPdfExportOptions = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const marginMap = {
        compact: 28,
        normal: 36,
        spacious: 48,
      };
      const margin = marginMap[options.marginOption || "normal"] || 36;

      // Font mapping to standard PDF fonts
      let regularFont = "Helvetica";
      let boldFont = "Helvetica-Bold";
      let italicFont = "Helvetica-Oblique";

      const requestedFont = options.fontFamily || "Inter";
      if (requestedFont === "Merriweather") {
        regularFont = "Times-Roman";
        boldFont = "Times-Bold";
        italicFont = "Times-Italic";
      } else if (requestedFont === "JetBrains Mono") {
        regularFont = "Courier";
        boldFont = "Courier-Bold";
        italicFont = "Courier-Oblique";
      }

      // Font size scales
      const sizeScale = {
        small: { name: 18, title: 10, section: 11, body: 9, meta: 8 },
        regular: { name: 20, title: 11, section: 12, body: 9.5, meta: 8.5 },
        large: { name: 22, title: 12, section: 13, body: 10.5, meta: 9 },
      };
      const sizes = sizeScale[options.fontSize || "regular"] || sizeScale.regular;

      const accentColor = options.accentColor || "#4f46e5";
      const template = options.template || resume.template || "modern";

      // A4 dimensions: [595.28, 841.89]
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: margin, bottom: margin, left: margin, right: margin },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: `${resume.name || "Resume"} - Nexa Career Platform`,
          Author: resume.name || "Nexa AI",
          Subject: resume.headline || "Professional Resume",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const printableWidth = 595.28 - margin * 2;
      const bottomLimit = 841.89 - margin;

      // Helper to check for page break before adding section
      function ensureSpace(heightNeeded: number) {
        if (doc.y + heightNeeded > bottomLimit) {
          doc.addPage();
        }
      }

      // 1. Header Section
      if (template === "modern") {
        // Modern decorative accent bar
        doc.rect(margin, margin, 4, sizes.name * 1.5).fill(accentColor);
        doc
          .font(boldFont)
          .fontSize(sizes.name)
          .fillColor("#0f172a")
          .text(resume.name || "Full Name", margin + 12, margin);

        if (resume.headline) {
          doc
            .font(regularFont)
            .fontSize(sizes.title)
            .fillColor(accentColor)
            .text(resume.headline, margin + 12, doc.y + 2);
        }
      } else if (template === "executive") {
        doc
          .font(boldFont)
          .fontSize(sizes.name)
          .fillColor("#0f172a")
          .text(resume.name || "Full Name", { align: "center" });

        if (resume.headline) {
          doc
            .font(regularFont)
            .fontSize(sizes.title)
            .fillColor("#475569")
            .text(resume.headline.toUpperCase(), { align: "center" });
        }
        doc
          .moveTo(margin, doc.y + 4)
          .lineTo(margin + printableWidth, doc.y + 4)
          .strokeColor(accentColor)
          .lineWidth(1.5)
          .stroke();
        doc.moveDown(0.5);
      } else {
        // Classic / Minimal
        doc
          .font(boldFont)
          .fontSize(sizes.name)
          .fillColor("#0f172a")
          .text(resume.name || "Full Name");

        if (resume.headline) {
          doc
            .font(regularFont)
            .fontSize(sizes.title)
            .fillColor("#475569")
            .text(resume.headline);
        }
      }

      // Contact Line
      const contactItems: string[] = [
        resume.email,
        resume.phone,
        resume.location,
        resume.linkedin,
        resume.website,
      ].filter(Boolean);

      if (contactItems.length) {
        doc.moveDown(0.3);
        doc
          .font(regularFont)
          .fontSize(sizes.meta)
          .fillColor("#64748b")
          .text(contactItems.join("  •  "), {
            align: template === "executive" ? "center" : "left",
          });
      }

      doc.moveDown(0.6);

      // Section Header Generator
      function renderSectionHeader(title: string) {
        ensureSpace(40);
        doc.moveDown(0.4);
        doc
          .font(boldFont)
          .fontSize(sizes.section)
          .fillColor(accentColor)
          .text(title.toUpperCase());

        doc
          .moveTo(margin, doc.y + 2)
          .lineTo(margin + printableWidth, doc.y + 2)
          .strokeColor("#e2e8f0")
          .lineWidth(0.8)
          .stroke();

        doc.moveDown(0.4);
      }

      // Bullet character formatting
      const bulletCharMap: Record<string, string> = {
        disc: "•",
        dash: "–",
        arrow: "›",
        square: "▪",
      };
      const bChar = bulletCharMap[options.bulletStyle || "disc"] || "•";

      // 2. Summary
      if (resume.summary) {
        renderSectionHeader("Professional Summary");
        doc
          .font(regularFont)
          .fontSize(sizes.body)
          .fillColor("#334155")
          .text(resume.summary, {
            align: "justify",
            lineGap: 2,
          });
      }

      // 3. Work Experience
      if (resume.experience && resume.experience.length) {
        renderSectionHeader("Experience");
        for (const exp of resume.experience) {
          if (!exp.role && !exp.company && !exp.details) continue;
          ensureSpace(50);

          // Role and Company Line
          const roleText = exp.role || "Role";
          const companyText = exp.company ? ` at ${exp.company}` : "";
          const datesText = exp.dates || "";

          doc
            .font(boldFont)
            .fontSize(sizes.body + 0.5)
            .fillColor("#0f172a")
            .text(`${roleText}${companyText}`, { continued: !!datesText });

          if (datesText) {
            doc
              .font(regularFont)
              .fontSize(sizes.meta)
              .fillColor("#64748b")
              .text(datesText, { align: "right" });
          }

          // Bullet Details
          if (exp.details) {
            const lines = exp.details
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean);

            doc.font(regularFont).fontSize(sizes.body).fillColor("#334155");
            for (const line of lines) {
              const cleanBullet = line.replace(/^[•\-*▪›]\s*/, "");
              ensureSpace(20);
              doc.text(`  ${bChar}  ${cleanBullet}`, {
                indent: 8,
                lineGap: 1.5,
              });
            }
          }
          doc.moveDown(0.4);
        }
      }

      // 4. Skills
      if (resume.skills) {
        renderSectionHeader("Skills & Competencies");
        ensureSpace(30);
        doc
          .font(regularFont)
          .fontSize(sizes.body)
          .fillColor("#334155")
          .text(resume.skills, { lineGap: 2 });
      }

      // 5. Education
      if (resume.education && resume.education.length) {
        renderSectionHeader("Education");
        for (const edu of resume.education) {
          if (!edu.school && !edu.degree) continue;
          ensureSpace(35);

          const degreeText = edu.degree || "Degree Program";
          const schoolText = edu.school ? `, ${edu.school}` : "";
          const datesText = edu.dates || "";

          doc
            .font(boldFont)
            .fontSize(sizes.body)
            .fillColor("#0f172a")
            .text(`${degreeText}${schoolText}`, { continued: !!datesText });

          if (datesText) {
            doc
              .font(regularFont)
              .fontSize(sizes.meta)
              .fillColor("#64748b")
              .text(datesText, { align: "right" });
          }
          doc.moveDown(0.2);
        }
      }

      // 6. Projects
      if (resume.projects && resume.projects.length) {
        renderSectionHeader("Projects");
        for (const proj of resume.projects) {
          if (!proj.name && !proj.details) continue;
          ensureSpace(40);

          doc
            .font(boldFont)
            .fontSize(sizes.body)
            .fillColor("#0f172a")
            .text(proj.name, { continued: !!proj.link });

          if (proj.link) {
            doc
              .font(regularFont)
              .fontSize(sizes.meta)
              .fillColor(accentColor)
              .text(`  (${proj.link})`);
          }

          if (proj.details) {
            doc
              .font(regularFont)
              .fontSize(sizes.body)
              .fillColor("#334155")
              .text(proj.details, { indent: 8, lineGap: 1.5 });
          }
          doc.moveDown(0.3);
        }
      }

      // 7. Certifications
      if (resume.certifications && resume.certifications.length) {
        renderSectionHeader("Certifications");
        for (const cert of resume.certifications) {
          if (!cert.name) continue;
          ensureSpace(25);

          const certName = cert.name;
          const issuer = cert.issuer ? ` - ${cert.issuer}` : "";
          const date = cert.date || "";

          doc
            .font(boldFont)
            .fontSize(sizes.body)
            .fillColor("#0f172a")
            .text(`${certName}${issuer}`, { continued: !!date });

          if (date) {
            doc
              .font(regularFont)
              .fontSize(sizes.meta)
              .fillColor("#64748b")
              .text(date, { align: "right" });
          }
        }
      }

      // 8. Key Achievements & Honors
      if (resume.achievements && resume.achievements.trim()) {
        renderSectionHeader("Achievements & Honors");
        const lines = resume.achievements.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
        for (const line of lines) {
          ensureSpace(18);
          doc
            .font(regularFont)
            .fontSize(sizes.body)
            .fillColor("#334155")
            .text(`• ${line.replace(/^[•\-*▪›]\s*/, "")}`, { indent: 8, lineGap: 1.5 });
        }
      }

      // 9. Languages
      if (resume.languages && resume.languages.trim()) {
        renderSectionHeader("Languages");
        ensureSpace(20);
        doc
          .font(regularFont)
          .fontSize(sizes.body)
          .fillColor("#334155")
          .text(resume.languages, { lineGap: 1.5 });
      }

      // 10. Custom Section
      if (resume.customTitle && resume.customContent && resume.customContent.trim()) {
        renderSectionHeader(resume.customTitle || "Additional Information");
        ensureSpace(25);
        doc
          .font(regularFont)
          .fontSize(sizes.body)
          .fillColor("#334155")
          .text(resume.customContent, { lineGap: 1.5 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

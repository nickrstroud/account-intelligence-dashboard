import { notFound } from "next/navigation";
import { getCompanies, getCompanyBySlug, getCompanyHistory, slugify } from "@/lib/data";
import AccountTimeline from "./AccountTimeline";
import CompanyLogo from "@/app/CompanyLogo";
import { daysUntil, formatRenewalDate, formatContractValue } from "@/lib/account-fields";

const RENEWAL_WARNING_DAYS = 120;

export function generateStaticParams() {
  return getCompanies().map((c) => ({ slug: slugify(c.name) }));
}

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) notFound();

  const history = getCompanyHistory(slug);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <CompanyLogo website={company.website} size={26} />
          <h1 className="text-xl font-semibold text-slate-900">{company.name}</h1>
        </div>
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-500 hover:text-slate-800 hover:underline"
        >
          {company.website}
        </a>
        <p className="text-xs text-slate-400 mt-1">
          {company.isPublic ? `Public${company.ticker ? ` · ${company.ticker}` : ""}` : "Privately held"}
        </p>

        <div className="mt-2 space-y-1">
          {company.renewalDate &&
            (() => {
              const days = daysUntil(company.renewalDate);
              const isWarning = days < RENEWAL_WARNING_DAYS;
              return (
                <p
                  className={
                    isWarning
                      ? "text-xs font-bold text-red-800 bg-red-100 border border-red-300 rounded px-2 py-1 w-fit"
                      : "text-xs text-slate-400"
                  }
                >
                  Renewal Date: {formatRenewalDate(company.renewalDate)} ({days} days from renewal)
                </p>
              );
            })()}

          {company.contractValue != null && (
            <p className="text-xs text-slate-400">Contract Value: {formatContractValue(company.contractValue)}</p>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No runs recorded for this account yet.</p>
      ) : (
        <AccountTimeline history={history} />
      )}
    </div>
  );
}

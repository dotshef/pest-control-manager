import Link from "next/link";
import { Plus } from "lucide-react";

type CommonProps = {
  label: string;
  ariaLabel?: string;
};

type RegisterFabProps = CommonProps & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
);

const FAB_CLASS =
  "fixed z-40 right-4 bottom-[calc(5rem+env(safe-area-inset-bottom)+10px)] size-14 rounded-full shadow-lg flex items-center justify-center bg-primary text-primary-foreground transition-colors cursor-pointer md:static md:ml-auto md:h-auto md:w-auto md:rounded-lg md:shadow-none md:px-4 md:py-2 md:gap-2";

export function RegisterFab(props: RegisterFabProps) {
  const { label, ariaLabel } = props;
  const aria = ariaLabel ?? label;

  const content = (
    <>
      <Plus className="w-6 h-6 md:w-4 md:h-4" />
      <span className="hidden md:inline text-base font-medium">{label}</span>
    </>
  );

  if (props.href) {
    return (
      <Link href={props.href} aria-label={aria} className={FAB_CLASS}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} aria-label={aria} className={FAB_CLASS}>
      {content}
    </button>
  );
}

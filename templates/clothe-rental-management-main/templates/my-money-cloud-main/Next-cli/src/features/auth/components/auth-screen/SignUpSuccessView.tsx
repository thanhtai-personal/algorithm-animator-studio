import { Button } from "@/components/ui/button";

type SignUpSuccessViewProps = {
  email: string;
  onDone: () => void;
  doneLabel: string;
};

export function SignUpSuccessView({ email, onDone, doneLabel }: SignUpSuccessViewProps) {
  return (
    <div className="space-y-4 text-center">
      {email ? <p className="text-sm font-semibold">{email}</p> : null}
      <Button type="button" className="w-full" onClick={onDone}>
        {doneLabel}
      </Button>
    </div>
  );
}

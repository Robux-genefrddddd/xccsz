import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline?: () => void;
}

export function DisclaimerModal({
  isOpen,
  onAccept,
  onDecline,
}: DisclaimerModalProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onDecline}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/20 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/40">
              <AlertCircle className="w-6 h-6 text-orange-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Disclaimer & Responsible Use Policy
            </DialogTitle>
          </div>
          <DialogDescription className="text-white/70">
            Please read and accept the terms before continuing with Vanilla AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
          <div className="space-y-3 text-sm text-white/80">
            <div>
              <h3 className="font-semibold text-white mb-2">
                🤖 About Vanilla AI
              </h3>
              <p>
                Vanilla AI is an artificial intelligence assistant designed to
                help you with various tasks, answer questions, and provide
                information.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                ⚠️ User Responsibility
              </h3>
              <p>
                Users are fully responsible for how they use this AI and the
                outputs generated. You acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>
                  You are responsible for verifying the accuracy of AI-generated
                  content
                </li>
                <li>
                  You will not use the AI for illegal, harmful, or unethical
                  purposes
                </li>
                <li>
                  You understand that AI may make mistakes or provide incorrect
                  information
                </li>
                <li>
                  You will not use the output to create content that infringes
                  on intellectual property rights
                </li>
                <li>
                  You assume all liability for the use of generated content
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                📋 Prohibited Uses
              </h3>
              <p>You agree not to use Vanilla AI for:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>Creating harmful, illegal, or malicious content</li>
                <li>Impersonation or fraud</li>
                <li>Harassment or abuse</li>
                <li>Violating privacy or security</li>
                <li>
                  Generating content for human trafficking or exploitation
                </li>
                <li>
                  Any activity that violates local, state, or international law
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">
                ✅ Your Commitment
              </h3>
              <p>
                By accepting these terms, you commit to using Vanilla AI
                responsibly and ethically. You understand that misuse may result
                in account suspension or termination.
              </p>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-4">
              <p className="text-sm text-orange-200">
                <strong>Remember:</strong> You are responsible for your actions.
                Use AI as a tool to enhance your productivity, not as a
                replacement for critical thinking and human judgment.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-6 border-t border-white/10 pt-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-5 h-5 rounded border-white/30 bg-white/10 cursor-pointer accent-orange-500"
            />
            <span className="text-sm text-white/80 group-hover:text-white transition-colors">
              I have read and accept the Responsible Use Policy
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 hover:border-white/40 text-white/70 hover:text-white transition-colors font-medium text-sm"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Accept & Continue
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

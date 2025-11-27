export interface UserIP {
  id: string;
  userId: string;
  email?: string;
  ipAddress: string;
  lastLogin?: number;
  createdAt?: number;
  isVPN?: boolean;
  vpnProvider?: string;
}

export interface IPBan {
  id?: string;
  ipAddress: string;
  reason: string;
  bannedAt?: any;
  expiresAt?: any;
  isPermanent?: boolean;
}

export class IPService {
  static async getUserIP(): Promise<string> {
    try {
      const response = await fetch("/api/get-ip");
      if (!response.ok) {
        throw new Error("Failed to get IP");
      }
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error("Error getting IP:", error);
      return "unknown";
    }
  }

  static async checkVPN(ipAddress: string): Promise<{
    isVPN: boolean;
    provider?: string;
  }> {
    try {
      const response = await fetch("/api/check-vpn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress }),
      });

      if (!response.ok) {
        return { isVPN: false };
      }

      const data = await response.json();
      return {
        isVPN: data.isVPN || false,
        provider: data.provider,
      };
    } catch (error) {
      console.error("Error checking VPN:", error);
      return { isVPN: false };
    }
  }

  static async recordUserIP(
    userId: string,
    email: string,
    ipAddress: string,
  ): Promise<void> {
    try {
      const response = await fetch("/api/record-user-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, ipAddress }),
      });

      if (!response.ok) {
        throw new Error("Failed to record user IP");
      }

      await this.checkIPLimit(ipAddress);
    } catch (error) {
      console.error("Error recording user IP:", error);
    }
  }

  static async updateUserIPLogin(
    userId: string,
    ipAddress: string,
  ): Promise<void> {
    if (!userId || !ipAddress) {
      console.warn(
        "updateUserIPLogin called with undefined userId or ipAddress",
      );
      return;
    }

    try {
      const response = await fetch("/api/update-user-ip-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ipAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to update user IP login: ${response.status}`,
        );
      }
    } catch (error) {
      console.error("Error updating user IP login:", error);
      // Non-critical operation - don't block login
    }
  }

  static async checkIPLimit(
    ipAddress: string,
    maxAccountsPerIP: number = 1,
  ): Promise<{
    isLimitExceeded: boolean;
    accountCount: number;
    maxAccounts: number;
  }> {
    if (!ipAddress) {
      console.warn("checkIPLimit called with undefined ipAddress");
      return {
        isLimitExceeded: false,
        accountCount: 0,
        maxAccounts: maxAccountsPerIP,
      };
    }

    try {
      const response = await fetch("/api/check-ip-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress, maxAccounts: maxAccountsPerIP }),
      });

      if (!response.ok) {
        return {
          isLimitExceeded: false,
          accountCount: 0,
          maxAccounts: maxAccountsPerIP,
        };
      }

      const data = await response.json();
      return {
        isLimitExceeded: data.isLimitExceeded,
        accountCount: data.accountCount,
        maxAccounts: data.maxAccounts,
      };
    } catch (error) {
      console.error("Error checking IP limit:", error);
      return {
        isLimitExceeded: false,
        accountCount: 0,
        maxAccounts: maxAccountsPerIP,
      };
    }
  }

  static async checkIPBan(ipAddress: string): Promise<IPBan | null> {
    if (!ipAddress) {
      console.warn("checkIPBan called with undefined ipAddress");
      return null;
    }

    try {
      const response = await fetch("/api/check-ip-ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.banned) {
        return null;
      }

      return {
        ipAddress,
        reason: data.reason,
        expiresAt: data.expiresAt,
        isPermanent: !data.expiresAt,
      };
    } catch (error) {
      console.error("Error checking IP ban:", error);
      return null;
    }
  }
}

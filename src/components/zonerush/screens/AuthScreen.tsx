// @ts-nocheck
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "../toast";
import { BG, S1, S2, BR, T, TL, TG, TR, TX, TM, TD, FONT } from "../constants";
import type { AuthScreenProps } from "../types";

export HEADER
cat /tmp/auth_body.txt >> src/components/zonerush/screens/AuthScreen.tsx
echo "Created AuthScreen"

# QuestScreen
{
echo "$IMPORTS_COMMON"
echo 'import type { QuestScreenProps, MissionCardProps } from "../types";'
echo ''
echo 'import { MissionCard } from "./HomeScreen";'
echo ''
echo 'export '
cat /tmp/quest_body.txt
} > src/components/zonerush/screens/QuestScreen.tsx
echo "Created QuestScreen"

# MarketScreen
{
echo "$IMPORTS_COMMON"
echo 'import type { MarketScreenProps } from "../types";'
echo ''
echo 'export '
cat /tmp/market_body.txt
} > src/components/zonerush/screens/MarketScreen.tsx
echo "Created MarketScreen"

# ClanScreen
{
echo "$IMPORTS_COMMON"
echo 'import type { ClanScreenProps, NoClanScreenProps, ClanHubProps, WarTabProps, TreasuryTabProps } from "../types";'
echo 'import { ZoneMapScreen } from "./ZoneMapScreen";'
echo ''
echo 'export '
cat /tmp/clan_body.txt
} > src/components/zonerush/screens/ClanScreen.tsx
echo "Created ClanScreen"

# ProfileScreen
{
echo "$IMPORTS_COMMON"
echo ''
echo 'export '
cat /tmp/profile_body.txt
} > src/components/zonerush/screens/ProfileScreen.tsx
echo "Created ProfileScreen"

# ZoneMapScreen
{
echo "$IMPORTS_COMMON"
echo ''
cat /tmp/zonemap_body.txt | head -7
echo ''
echo 'export '
cat /tmp/zonemap_body.txt | tail -n +8
} > src/components/zonerush/screens/ZoneMapScreen.tsx
echo "Created ZoneMapScreen"

# AdminDashboard
{
echo "$IMPORTS_COMMON"
echo 'import type { AdminSectionTitleProps, KpiCardProps, StatusPillProps, StrengthBarProps, AdminTableProps, MiniLineChartProps, DualLineChartProps, DonutChartProps, PlayerModalProps } from "../types";'
echo ''
echo 'export '
cat /tmp/admin_body.txt
} > src/components/zonerush/admin/AdminDashboard.tsx
echo "Created AdminDashboard"

echo "All screen files created"
wc -l src/components/zonerush/screens/*.tsx src/components/zonerush/admin/*.tsx

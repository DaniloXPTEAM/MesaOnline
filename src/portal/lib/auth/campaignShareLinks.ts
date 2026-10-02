/**
 * Liga uma campanha LOCAL (localStorage) ao registro correspondente no
 * servidor de compartilhamento, sem alterar o formato de CampaignRecord.
 */
const KEY = "tormenta20_online_campaign_shares_v1";

export function getShareLinks(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function setShareLink(localCampaignId: string, serverCampaignId: string) {
  const map = getShareLinks();
  map[localCampaignId] = serverCampaignId;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* localStorage indisponível: link vale só para a sessão atual */
  }
}

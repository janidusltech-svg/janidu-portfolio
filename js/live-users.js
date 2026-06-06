const SUPABASE_URL = "https://lrlfducplruqqxovqemd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RdrCMzG_XhZ70ga-O3muhw_Ks2wa7Y2";

const liveCountEl = document.getElementById("liveUserCount");

if (window.supabase && liveCountEl) {
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const userId =
    localStorage.getItem("study_hub_user_id") ||
    crypto.randomUUID();

  localStorage.setItem("study_hub_user_id", userId);

  const channel = client.channel("study-hub-online-users", {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  function updateLiveCount() {
    const state = channel.presenceState();
    const count = Object.keys(state).length;
    liveCountEl.textContent = count || 1;
  }

  channel
    .on("presence", { event: "sync" }, updateLiveCount)
    .on("presence", { event: "join" }, updateLiveCount)
    .on("presence", { event: "leave" }, updateLiveCount)
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          page: "study.html",
        });

        updateLiveCount();
      }
    });

  window.addEventListener("beforeunload", async () => {
    await channel.untrack();
  });
}
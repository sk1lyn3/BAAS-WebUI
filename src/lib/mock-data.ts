import type { TaskConfig, LogEntry, DeviceConfig, Resources } from './types'

const now = () => Math.floor(Date.now() / 1000)

export const INITIAL_TASKS: TaskConfig[] = [
  { func_name: 'cafe_reward',            event_name: '咖啡厅奖励',    enabled: true,  priority: 1,  interval: 86400, next_tick: now() + 1800,  daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'group',                  event_name: '社团体力',       enabled: true,  priority: 2,  interval: 86400, next_tick: now() + 3600,  daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'lesson',                 event_name: '日程',           enabled: true,  priority: 3,  interval: 86400, next_tick: now() + 5400,  daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'collect_reward',         event_name: '领取奖励',       enabled: true,  priority: 4,  interval: 3600,  next_tick: now() + 900,   daily_reset: [[4,0,0],[12,0,0],[20,0,0]], disabled_time_range: [], pre_task: [],     post_task: [] },
  { func_name: 'mail',                   event_name: '邮箱',           enabled: true,  priority: 5,  interval: 86400, next_tick: now() + 7200,  daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'arena',                  event_name: '竞技场',         enabled: true,  priority: 6,  interval: 86400, next_tick: now() + 10800, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'common_shop',            event_name: '普通商店',       enabled: true,  priority: 7,  interval: 86400, next_tick: now() + 9000,  daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'tactical_challenge_shop',event_name: '竞技场商店',     enabled: true,  priority: 8,  interval: 86400, next_tick: now() + 10000, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: ['arena'],    post_task: [] },
  { func_name: 'create',                 event_name: '制造',           enabled: true,  priority: 9,  interval: 3600,  next_tick: now() + 1200,  daily_reset: [],                    disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'rewarded_task',          event_name: '悬赏通缉',       enabled: true,  priority: 10, interval: 86400, next_tick: now() + 12600, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'momo_talk',             event_name: 'MomoTalk',       enabled: true,  priority: 11, interval: 86400, next_tick: now() + 14400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'friend',                 event_name: '好友互动',       enabled: true,  priority: 12, interval: 86400, next_tick: now() + 16200, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'pass',                   event_name: '通行证奖励',     enabled: true,  priority: 13, interval: 86400, next_tick: now() + 18000, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'collect_daily_free_power',event_name: '每日免费体力',  enabled: true,  priority: 14, interval: 86400, next_tick: now() + 19800, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'normal_task',            event_name: '普通图扫荡',     enabled: true,  priority: 15, interval: 86400, next_tick: now() + 21600, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'hard_task',              event_name: '困难图扫荡',     enabled: true,  priority: 16, interval: 86400, next_tick: now() + 23400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'no1_cafe_invite',        event_name: '咖啡厅邀请一号', enabled: false, priority: 17, interval: 86400, next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'no2_cafe_invite',        event_name: '咖啡厅邀请二号', enabled: false, priority: 18, interval: 86400, next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'total_assault',          event_name: '总力战',         enabled: false, priority: 19, interval: 86400, next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'scrimmage',              event_name: '学园交流会',     enabled: false, priority: 20, interval: 86400, next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'joint_firing_drill',     event_name: '联合火力演习',   enabled: false, priority: 21, interval: 86400, next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'explore_normal_task',    event_name: '普通图推图',     enabled: false, priority: 22, interval: -1,    next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'explore_hard_task',      event_name: '困难图推图',     enabled: false, priority: 23, interval: -1,    next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'activity_sweep',         event_name: '活动扫荡',       enabled: false, priority: 24, interval: 86400, next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'explore_activity_story', event_name: '活动剧情推图',   enabled: false, priority: 25, interval: -1,    next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'explore_activity_mission',event_name:'活动任务推图',   enabled: false, priority: 26, interval: -1,    next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'explore_activity_challenge',event_name:'活动挑战推图', enabled: false, priority: 27, interval: -1,    next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'main_story',             event_name: '主线剧情',       enabled: false, priority: 28, interval: -1,    next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'group_story',            event_name: '小组剧情',       enabled: false, priority: 29, interval: -1,    next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'mini_story',             event_name: '支线剧情',       enabled: false, priority: 30, interval: -1,    next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
  { func_name: 'clear_special_task_power',event_name:'特别委托体力',   enabled: false, priority: 31, interval: 86400, next_tick: now() + 86400, daily_reset: [[4,0,0]],             disabled_time_range: [], pre_task: [],           post_task: [] },
]

export const INITIAL_LOGS: LogEntry[] = []

export const INITIAL_RESOURCES: Resources = {
  ap: 143,
  apMax: 180,
  pyroxene: 3240,
  credits: 127400,
}

export const INITIAL_CONFIG: DeviceConfig = {
  server: 'CN',
  serial: '192.168.50.100:5555',
  screenshotMethod: 'scrcpy',
  screenshotInterval: 0.5,
  thenAction: '无动作',
  cafeInvite1: '白子',
  cafeInvite2: '',
  normalStages: '7-1, 7-2, 7-3',
  hardStages: '7-1, 7-2, 7-3',
  notifyEnabled: false,
  notifyWebhook: '',
  autoStart: false,
}

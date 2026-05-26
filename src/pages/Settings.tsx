import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Save, RotateCcw, Wifi, Upload } from 'lucide-react'
import Toggle from '../components/Toggle'
import ConfigSwitcher from '../components/ConfigSwitcher'
import { cn } from '../lib/utils'
import { api } from '../lib/api'

interface Props {
  rawConfig: Record<string, unknown>
  onSave: (raw: Record<string, unknown>) => void
  serverOk: boolean
  configList: string[]
  activeConfig: string
  onSwitchConfig: (name: string) => void
  onCreateConfig: (name: string) => void
  onDeleteConfig: (name: string) => void
  onImport: (file: File) => Promise<void>
}

// ── tiny helper components ───────────────────────────────────────────────────

function Section({ title, subtitle, children, defaultOpen = false }: {
  title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="ba-card overflow-hidden">
      <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-ba-pale/30 transition-colors"
        onClick={() => setOpen(v => !v)}>
        <div className="text-left">
          <div className="font-semibold text-ba-navy text-sm">{title}</div>
          {subtitle && <div className="text-xs text-ba-muted mt-0.5">{subtitle}</div>}
        </div>
        <ChevronDown size={16} className={cn('text-ba-muted transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-ba-border/50 space-y-4">{children}</div>}
    </div>
  )
}

function Field({ label, hint, children, half }: {
  label: string; hint?: string; children: React.ReactNode; half?: boolean
}) {
  return (
    <div className={half ? 'flex-1 min-w-0' : ''}>
      <label className="ba-label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ba-muted mt-1">{hint}</p>}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4">{children}</div>
}

function SwitchRow({ label, hint, checked, onChange }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-ba-navy">{label}</div>
        {hint && <div className="text-xs text-ba-muted mt-0.5">{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// ── main component ───────────────────────────────────────────────────────────

export default function Settings({
  rawConfig, onSave, serverOk,
  configList, activeConfig, onSwitchConfig, onCreateConfig, onDeleteConfig, onImport
}: Props) {
  const [form, setForm] = useState<Record<string, unknown>>({ ...rawConfig })
  const [saved, setSaved] = useState(false)
  const [adbStatus, setAdbStatus] = useState<string | null>(null)
  const [adbLoading, setAdbLoading] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  // Sync form when rawConfig changes (e.g. after switching profiles)
  useEffect(() => { setForm({ ...rawConfig }) }, [rawConfig])

  // Typed accessors
  const str  = (k: string, d = '')       => (form[k] as string  ?? d)
  const num  = (k: string, d = 0)        => Number(form[k] ?? d)
  const bool = (k: string, d = false)    => Boolean(form[k] ?? d)
  const arr  = (k: string, d: unknown[] = []) => (form[k] as unknown[] ?? d)

  const set = (k: string, v: unknown) => {
    setForm(f => ({ ...f, [k]: v }))
    setSaved(false)
  }

  // ADB serial helpers
  const adbSerial = `${str('adbIP')}:${str('adbPort')}`.replace(/:$/, '')

  function handleSave() {
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setForm({ ...rawConfig })
    setSaved(false)
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-lg font-bold text-ba-navy">设置</h2>
          <ConfigSwitcher configList={configList} activeConfig={activeConfig} onSwitchConfig={onSwitchConfig} onCreateConfig={onCreateConfig} onDeleteConfig={onDeleteConfig} className="mt-1" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 ba-btn-ghost text-sm">
            <RotateCcw size={13} /> 重置
          </button>
          <button onClick={handleSave}
            className={cn('flex items-center gap-1.5 font-semibold px-5 py-2.5 rounded-lg transition-all text-sm',
              saved ? 'bg-ba-success text-white' : 'bg-ba-primary hover:bg-ba-hover text-white')}>
            <Save size={13} />
            {saved ? '已保存 ✓' : '保存'}
          </button>
        </div>
      </div>

      {/* ── 设备配置 ─────────────────────────────────────────────────── */}
      <Section title="设备配置" subtitle="ADB 连接、截图、控制方式" defaultOpen>
        <Row>
          <Field label="游戏服务器" half>
            <select className="ba-select" value={str('server', '国际服')}
              onChange={e => set('server', e.target.value)}>
              <option value="官服">官服</option>
              <option value="B服">B服</option>
              <option value="国际服">国际服 (Global)</option>
              <option value="国际服青少年">国际服青少年</option>
              <option value="韩国ONE">韩国ONE</option>
              <option value="Steam国际服">Steam国际服</option>
              <option value="日服">日服 (JP)</option>
              <option value="日服PC端">日服PC端</option>
            </select>
          </Field>
          <Field label="ADB IP" hint="设备 IP 或模拟器地址" half>
            <input className="ba-input" value={str('adbIP')} onChange={e => set('adbIP', e.target.value)} placeholder="192.168.x.x" />
          </Field>
          <Field label="ADB 端口" half>
            <div className="flex gap-2">
              <input className="ba-input flex-1" value={str('adbPort')} onChange={e => set('adbPort', e.target.value)} placeholder="5555" />
              <button type="button" disabled={!serverOk || adbLoading}
                onClick={async () => {
                  setAdbLoading(true); setAdbStatus(null)
                  const res = await api.adbConnect(adbSerial).catch(() => ({ ok: false, error: '请求失败' } as { ok: boolean; output?: string; error?: string }))
                  setAdbStatus(res.ok ? `✓ ${res.output ?? '已连接'}` : `✗ ${res.error ?? '失败'}`)
                  setAdbLoading(false)
                }}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all shrink-0',
                  serverOk ? 'border-ba-primary text-ba-primary hover:bg-ba-pale' : 'border-ba-border text-ba-border cursor-not-allowed')}>
                <Wifi size={13} />
                {adbLoading ? '连接中...' : '测试'}
              </button>
            </div>
            {adbStatus && <p className={cn('text-[11px] mt-1', adbStatus.startsWith('✓') ? 'text-ba-success' : 'text-ba-error')}>{adbStatus}</p>}
          </Field>
        </Row>
        <Row>
          <Field label="截图方式" hint="uiautomator2 按需截图较快，adb 无需额外 agent 兼容性最好，scrcpy 持续解码视频流，virtual_scrcpy 缓存帧极快（需虚拟屏）" half>
            <select className="ba-select" value={str('screenshot_method', 'scrcpy')}
              onChange={e => set('screenshot_method', e.target.value)}>
              <option value="uiautomator2">uiautomator2（推荐）</option>
              <option value="virtual_scrcpy">virtual_scrcpy（虚拟屏，缓存帧）</option>
              <option value="scrcpy">scrcpy（持续视频流）</option>
              <option value="adb">adb screencap（兼容性最好）</option>
            </select>
          </Field>
          <Field label="操控方式" hint="uiautomator2 通过 agent 注入触控，virtual_scrcpy 用 adb input -d 控制虚拟屏，adb 每次起 shell 最慢" half>
            <select className="ba-select" value={str('control_method', 'uiautomator2')}
              onChange={e => set('control_method', e.target.value)}>
              <option value="uiautomator2">uiautomator2（推荐）</option>
              <option value="virtual_scrcpy">virtual_scrcpy（虚拟屏）</option>
              <option value="scrcpy">scrcpy（socket 注入）</option>
              <option value="adb">adb（兼容性最好）</option>
            </select>
          </Field>
          <Field label="截图间隔 (秒)" hint="最小 0.3 秒" half>
            <input type="number" step="0.1" min="0.3" max="5" className="ba-input"
              value={num('screenshot_interval', 0.5)} onChange={e => set('screenshot_interval', +e.target.value)} />
          </Field>
        </Row>
      </Section>

      {/* ── 模拟器 ───────────────────────────────────────────────────── */}
      <Section title="模拟器" subtitle="自动启动模拟器（真机用户可忽略）">
        <SwitchRow label="启动时自动开启模拟器" checked={bool('open_emulator_stat')} onChange={v => set('open_emulator_stat', v)} />
        {bool('open_emulator_stat') && (
          <Row>
            <Field label="模拟器可执行文件路径" half>
              <input className="ba-input" value={str('program_address')} onChange={e => set('program_address', e.target.value)} placeholder="C:\LDPlayer\LDPlayer.exe" />
            </Field>
            <Field label="等待启动时间 (秒)" half>
              <input type="number" min="30" max="600" className="ba-input"
                value={num('emulator_wait_time', 180)} onChange={e => set('emulator_wait_time', +e.target.value)} />
            </Field>
          </Row>
        )}
        <div className="border-t border-ba-border/40 pt-3 space-y-3">
          <div className="text-xs font-semibold text-ba-muted uppercase tracking-wide">多开配置</div>
          <SwitchRow label="启用多实例模式" checked={bool('emulatorIsMultiInstance')} onChange={v => set('emulatorIsMultiInstance', v)} />
          {bool('emulatorIsMultiInstance') && (
            <Row>
              <Field label="实例编号" half>
                <input type="number" min="0" max="9" className="ba-input"
                  value={num('emulatorMultiInstanceNumber', 0)} onChange={e => set('emulatorMultiInstanceNumber', +e.target.value)} />
              </Field>
              <Field label="实例名称" half>
                <input className="ba-input" value={str('multiEmulatorName')} onChange={e => set('multiEmulatorName', e.target.value)} placeholder="MuMuPlayer-12.0-0" />
              </Field>
            </Row>
          )}
        </div>
      </Section>

      {/* ── 咖啡厅 ───────────────────────────────────────────────────── */}
      <Section title="咖啡厅" subtitle="邀请、奖励、互动配置">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <SwitchRow label="领取小时奖励" checked={bool('cafe_reward_collect_hour_reward', true)} onChange={v => set('cafe_reward_collect_hour_reward', v)} />
          <SwitchRow label="使用邀请券" checked={bool('cafe_reward_use_invitation_ticket', true)} onChange={v => set('cafe_reward_use_invitation_ticket', v)} />
          <SwitchRow label="有二号咖啡厅" checked={bool('cafe_reward_has_no2_cafe')} onChange={v => set('cafe_reward_has_no2_cafe', v)} />
          <SwitchRow label="优先邀请好感最低" checked={bool('cafe_reward_lowest_affection_first', true)} onChange={v => set('cafe_reward_lowest_affection_first', v)} />
          <SwitchRow label="允许重复邀请" checked={bool('cafe_reward_allow_duplicate_invite')} onChange={v => set('cafe_reward_allow_duplicate_invite', v)} />
          <SwitchRow label="允许换装邀请" checked={bool('cafe_reward_allow_exchange_student')} onChange={v => set('cafe_reward_allow_exchange_student', v)} />
        </div>
        <Row>
          <Field label="拍头轮次" half>
            <input type="number" min="0" max="20" className="ba-input"
              value={num('cafe_reward_affection_pat_round', 4)} onChange={e => set('cafe_reward_affection_pat_round', +e.target.value)} />
          </Field>
          <Field label="拍头方式" half>
            <select className="ba-select" value={str('patStyle', '拖动礼物')} onChange={e => set('patStyle', e.target.value)}>
              <option value="拖动礼物">拖动礼物</option>
              <option value="点击">点击</option>
            </select>
          </Field>
        </Row>
        <div className="border-t border-ba-border/40 pt-3 space-y-3">
          <div className="text-xs font-semibold text-ba-muted uppercase tracking-wide">一号位邀请</div>
          <Row>
            <Field label="邀请模式" half>
              <select className="ba-select" value={str('cafe_reward_invite1_criterion', 'starred')} onChange={e => set('cafe_reward_invite1_criterion', e.target.value)}>
                <option value="starred">按星级位置</option>
                <option value="lowest_affection">最低好感</option>
                <option value="highest_affection">最高好感</option>
                <option value="name">指定学生</option>
              </select>
            </Field>
            {str('cafe_reward_invite1_criterion') === 'starred' && (
              <Field label="星级位置 (1-5)" half>
                <input type="number" min="1" max="5" className="ba-input"
                  value={num('cafe_reward_invite1_starred_student_position', 1)} onChange={e => set('cafe_reward_invite1_starred_student_position', +e.target.value)} />
              </Field>
            )}
            {str('cafe_reward_invite1_criterion') === 'name' && (
              <Field label="指定学生" hint="多个学生用逗号分隔" half>
                <input className="ba-input" value={(arr('favorStudent1') as string[]).join(', ')}
                  onChange={e => set('favorStudent1', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="白子, 花凛" />
              </Field>
            )}
          </Row>
        </div>
        {bool('cafe_reward_has_no2_cafe') && (
          <div className="border-t border-ba-border/40 pt-3 space-y-3">
            <div className="text-xs font-semibold text-ba-muted uppercase tracking-wide">二号位邀请</div>
            <Row>
              <Field label="邀请模式" half>
                <select className="ba-select" value={str('cafe_reward_invite2_criterion', 'starred')} onChange={e => set('cafe_reward_invite2_criterion', e.target.value)}>
                  <option value="starred">按星级位置</option>
                  <option value="lowest_affection">最低好感</option>
                  <option value="highest_affection">最高好感</option>
                  <option value="name">指定学生</option>
                </select>
              </Field>
              {str('cafe_reward_invite2_criterion') === 'starred' && (
                <Field label="星级位置 (1-5)" half>
                  <input type="number" min="1" max="5" className="ba-input"
                    value={num('cafe_reward_invite2_starred_student_position', 1)} onChange={e => set('cafe_reward_invite2_starred_student_position', +e.target.value)} />
                </Field>
              )}
              {str('cafe_reward_invite2_criterion') === 'name' && (
                <Field label="指定学生" hint="多个学生用逗号分隔" half>
                  <input className="ba-input" value={(arr('favorStudent2') as string[]).join(', ')}
                    onChange={e => set('favorStudent2', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="爱丽丝" />
                </Field>
              )}
            </Row>
          </div>
        )}
      </Section>

      {/* ── 关卡与推图 ───────────────────────────────────────────────── */}
      <Section title="关卡与推图" subtitle="扫荡关卡、推图、剧情">
        <Field label="普通图扫荡关卡" hint="逗号分隔，格式：关卡-次数，如 7-1-3, 7-2-3">
          <input className="ba-input" value={str('mainlinePriority')} onChange={e => set('mainlinePriority', e.target.value)} placeholder="7-1-3, 7-2-3" />
        </Field>
        <Field label="困难图扫荡关卡" hint="格式：关卡-次数，每关每日限 3 次，如 7-1-3">
          <input className="ba-input" value={str('hardPriority')} onChange={e => set('hardPriority', e.target.value)} placeholder="7-1-3, 7-2-3" />
        </Field>
        <Field label="推进主线剧情章节数" hint="设为 0 则不推进">
          <input type="number" min="0" max="50" className="ba-input w-32"
            value={str('main_story_regions', '0') || 0} onChange={e => set('main_story_regions', String(e.target.value))} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <SwitchRow label="推图简单模式" hint="仅需 1 支队伍" checked={bool('explore_task_use_simple_mode')} onChange={v => set('explore_task_use_simple_mode', v)} />
          <SwitchRow label="Boss 手动战斗" hint="Boss 战前暂停等待手动" checked={bool('manual_boss')} onChange={v => set('manual_boss', v)} />
        </div>
      </Section>

      {/* ── 竞技场 ───────────────────────────────────────────────────── */}
      <Section title="竞技场">
        <div className="grid grid-cols-2 gap-4">
          <SwitchRow label="排名第一时停止挑战" checked={bool('ArenaStopFightWhenRank1')} onChange={v => set('ArenaStopFightWhenRank1', v)} />
        </div>
        <Row>
          <Field label="对手等级差筛选" hint="负数=挑战比自己弱的，正数=挑战比自己强的" half>
            <input type="number" min="-50" max="50" className="ba-input"
              value={num('ArenaLevelDiff', 0)} onChange={e => set('ArenaLevelDiff', +e.target.value)} />
          </Field>
          <Field label="最大刷新次数" half>
            <input type="number" min="0" max="50" className="ba-input"
              value={num('maxArenaRefreshTimes', 10)} onChange={e => set('maxArenaRefreshTimes', +e.target.value)} />
          </Field>
          <Field label="挑战对手位置" half>
            <select className="ba-select" value={String(num('ArenaComponentNumber', 1))} onChange={e => set('ArenaComponentNumber', +e.target.value)}>
              <option value="1">第 1 位</option>
              <option value="2">第 2 位</option>
              <option value="3">第 3 位</option>
            </select>
          </Field>
          <Field label="购买竞技场门票" half>
            <select className="ba-select" value={String(num('purchase_arena_ticket_times', 0))} onChange={e => set('purchase_arena_ticket_times', +e.target.value)}>
              {['0','1','2','3'].map(v => <option key={v} value={v}>{v} 次</option>)}
            </select>
          </Field>
        </Row>
      </Section>

      {/* ── 扫荡次数 ─────────────────────────────────────────────────── */}
      <Section title="扫荡次数" subtitle="悬赏通缉、交流会、特别委托、活动">
        <Row>
          <Field label="悬赏通缉次数" hint="各区逗号分隔，如 2,2,2" half>
            <input className="ba-input" value={str('rewarded_task_times', '2,2,2')} onChange={e => set('rewarded_task_times', e.target.value)} />
          </Field>
          <Field label="悬赏购票次数" half>
            <select className="ba-select" value={str('purchase_rewarded_task_ticket_times', '0')} onChange={e => set('purchase_rewarded_task_ticket_times', e.target.value)}>
              {['0','1','2','3','4','5'].map(v => <option key={v} value={v}>{v} 次</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="学园交流会次数" hint="各区逗号分隔" half>
            <input className="ba-input" value={str('scrimmage_times', '2,2,2')} onChange={e => set('scrimmage_times', e.target.value)} />
          </Field>
          <Field label="交流会购票次数" half>
            <select className="ba-select" value={str('purchase_scrimmage_ticket_times', '0')} onChange={e => set('purchase_scrimmage_ticket_times', e.target.value)}>
              {['0','1','2','3'].map(v => <option key={v} value={v}>{v} 次</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="特别委托次数" hint="逗号分隔" half>
            <input className="ba-input" value={str('special_task_times', '1,1')} onChange={e => set('special_task_times', e.target.value)} />
          </Field>
        </Row>
        <div className="border-t border-ba-border/40 pt-3">
          <div className="text-xs font-semibold text-ba-muted uppercase tracking-wide mb-3">活动扫荡</div>
          <Row>
            <Field label="活动关卡编号" half>
              <input type="number" min="1" className="ba-input"
                value={num('activity_sweep_task_number', 1)} onChange={e => set('activity_sweep_task_number', +e.target.value)} />
            </Field>
            <Field label="扫荡次数" half>
              <input className="ba-input" value={str('activity_sweep_times', '0')} onChange={e => set('activity_sweep_times', e.target.value)} />
            </Field>
          </Row>
        </div>
      </Section>

      {/* ── 普通商店 ─────────────────────────────────────────────────── */}
      <Section title="普通商店" subtitle="选择每日自动购买的物品（与游戏内商店顺序一致）">
        <div className="grid grid-cols-2 gap-2">
          {(arr('CommonShopList', Array(16).fill(0)) as number[]).map((v, i) => (
            <label key={i} className="flex items-center gap-2 text-sm text-ba-navy cursor-pointer">
              <input type="checkbox" checked={!!v}
                onChange={e => {
                  const l = [...(arr('CommonShopList', Array(16).fill(0)) as number[])]
                  l[i] = e.target.checked ? 1 : 0
                  set('CommonShopList', l)
                }}
                className="accent-ba-primary w-4 h-4"
              />
              商品 {i + 1}
            </label>
          ))}
        </div>
        <Row>
          <Field label="商店刷新次数" half>
            <input type="number" min="0" max="10" className="ba-input"
              value={num('CommonShopRefreshTime', 0)} onChange={e => set('CommonShopRefreshTime', +e.target.value)} />
          </Field>
        </Row>
      </Section>

      {/* ── 战术挑战商店 ─────────────────────────────────────────────── */}
      <Section title="战术挑战商店" subtitle="选择每次自动购买的物品">
        {[
          '宫子神明文字x5','静子神明文字x5','真白神明文字x5','纱绫神明文字x5',
          '风香神明文字x5','歌原神明文字x5','30AP','60AP',
          '初级经验书x5','中级经验书x10','高级经验书x3','特级经验书x1',
          '信用点x5k','信用点x75k',
        ].map((name, i) => (
          <label key={i} className="flex items-center gap-2 text-sm text-ba-navy cursor-pointer">
            <input type="checkbox"
              checked={!!((arr('TacticalChallengeShopList', Array(14).fill(0)) as number[])[i])}
              onChange={e => {
                const l = [...(arr('TacticalChallengeShopList', Array(14).fill(0)) as number[])]
                l[i] = e.target.checked ? 1 : 0
                set('TacticalChallengeShopList', l)
              }}
              className="accent-ba-primary w-4 h-4"
            />
            {name}
          </label>
        ))}
        <Row>
          <Field label="商店刷新次数" half>
            <input type="number" min="0" max="5" className="ba-input"
              value={num('TacticalChallengeShopRefreshTime', 0)} onChange={e => set('TacticalChallengeShopRefreshTime', +e.target.value)} />
          </Field>
        </Row>
      </Section>

      {/* ── 制造 ─────────────────────────────────────────────────────── */}
      <Section title="制造" subtitle="装备制造配置">
        <Row>
          <Field label="制造次数" half>
            <input type="number" min="0" max="20" className="ba-input"
              value={num('createTime', 3)} onChange={e => set('createTime', String(e.target.value))} />
          </Field>
          <Field label="制造阶段" half>
            <select className="ba-select" value={String(num('create_phase', 1))} onChange={e => set('create_phase', +e.target.value)}>
              <option value="1">阶段一</option>
              <option value="2">阶段二</option>
              <option value="3">阶段三</option>
            </select>
          </Field>
        </Row>
        <SwitchRow label="使用加速票" checked={bool('use_acceleration_ticket')} onChange={v => set('use_acceleration_ticket', v)} />
        <Row>
          {[1, 2, 3].map(phase => (
            <Field key={phase} label={`阶段 ${phase} 选材规则`} half>
              <select className="ba-select" value={str(`create_phase_${phase}_select_item_rule`, 'default')}
                onChange={e => set(`create_phase_${phase}_select_item_rule`, e.target.value)}>
                {phase === 1 && <>
                  <option value="default">默认</option>
                </>}
                {phase === 2 && <>
                  <option value="primary">白色材料</option>
                  <option value="normal">蓝色材料</option>
                  <option value="primary_normal">白色+蓝色材料</option>
                  <option value="advanced">金色材料</option>
                  <option value="superior">紫色材料</option>
                  <option value="advanced_superior">金色+紫色材料</option>
                  <option value="primary_normal_advanced_superior">白+蓝+金+紫材料</option>
                  <option value="keystone">制造石</option>
                </>}
                {phase === 3 && <>
                  <option value="advanced">金色材料</option>
                  <option value="superior">紫色材料</option>
                  <option value="advanced_superior">金色+紫色材料</option>
                  <option value="keystone">制造石</option>
                </>}
              </select>
            </Field>
          ))}
        </Row>
      </Section>

      {/* ── 日程课 ───────────────────────────────────────────────────── */}
      <Section title="日程课（学园）">
        <SwitchRow label="优先邀请指定学生上课" checked={bool('lesson_enableInviteFavorStudent')} onChange={v => set('lesson_enableInviteFavorStudent', v)} />
        {bool('lesson_enableInviteFavorStudent') && (
          <Row>
            <Field label="指定学生" hint="多个用逗号分隔" half>
              <input className="ba-input" value={(arr('lesson_favorStudent') as string[]).join(', ')}
                onChange={e => set('lesson_favorStudent', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
            </Field>
            <SwitchRow label="优先最高好感等级" checked={bool('lesson_relationship_first')} onChange={v => set('lesson_relationship_first', v)} />
          </Row>
        )}
        <Field label="各区域上课次数" hint="6 个区域，逗号分隔，如 1,1,1,1,1,1">
          <input className="ba-input" value={(arr('lesson_times', [1,1,1,1,1,1]) as number[]).join(', ')}
            onChange={e => {
              const vals = e.target.value.split(',').map(s => parseInt(s.trim()) || 0)
              set('lesson_times', vals)
            }} />
        </Field>
        <Row>
          <Field label="购买课程券次数" half>
            <select className="ba-select" value={String(num('purchase_lesson_ticket_times', 0))} onChange={e => set('purchase_lesson_ticket_times', +e.target.value)}>
              {['0','1','2','3'].map(v => <option key={v} value={v}>{v} 次</option>)}
            </select>
          </Field>
        </Row>
      </Section>

      {/* ── 总力战 ───────────────────────────────────────────────────── */}
      <Section title="总力战">
        <Field label="最高挑战难度" half>
          <select className="ba-select max-w-xs" value={str('totalForceFightDifficulty', 'NORMAL')} onChange={e => set('totalForceFightDifficulty', e.target.value)}>
            {['NORMAL','HARD','VERYHARD','HARDCORE','EXTREME','INSANE','TORMENT'].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>
      </Section>

      {/* ── 作战演习 ─────────────────────────────────────────────────── */}
      <Section title="作战演习（联合火力）">
        <SwitchRow label="战斗后自动扫荡" checked={bool('drill_enable_sweep', true)} onChange={v => set('drill_enable_sweep', v)} />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="space-y-2">
              <div className="text-xs font-medium text-ba-muted">槽位 {i + 1}</div>
              <Field label="难度">
                <select className="ba-select" value={String((arr('drill_difficulty_list', [1,1,1]) as number[])[i] ?? 1)}
                  onChange={e => {
                    const l = [...(arr('drill_difficulty_list', [1,1,1]) as number[])]
                    l[i] = +e.target.value
                    set('drill_difficulty_list', l)
                  }}>
                  {[1,2,3,4,5].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="编队">
                <select className="ba-select" value={String((arr('drill_fight_formation_list', [1,2,3]) as number[])[i] ?? i + 1)}
                  onChange={e => {
                    const l = [...(arr('drill_fight_formation_list', [1,2,3]) as number[])]
                    l[i] = +e.target.value
                    set('drill_fight_formation_list', l)
                  }}>
                  {[1,2,3,4].map(f => <option key={f} value={f}>编队 {f}</option>)}
                </select>
              </Field>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 推送通知 ─────────────────────────────────────────────────── */}
      <Section title="推送通知" subtitle="任务完成 / 出错时通知">
        <div className="grid grid-cols-2 gap-4">
          <SwitchRow label="出错时推送" checked={bool('push_after_error')} onChange={v => set('push_after_error', v)} />
          <SwitchRow label="全部完成时推送" checked={bool('push_after_completion')} onChange={v => set('push_after_completion', v)} />
        </div>
        {(bool('push_after_error') || bool('push_after_completion')) && (
          <div className="space-y-3 pt-1">
            <Field label="JSON Webhook" hint="企业微信、bark 等">
              <input className="ba-input" value={str('push_json')} onChange={e => set('push_json', e.target.value)} placeholder="https://..." />
            </Field>
            <Field label="Server 酱 SendKey">
              <input className="ba-input" value={str('push_serverchan')} onChange={e => set('push_serverchan', e.target.value)} placeholder="SCT..." />
            </Field>
            <Field label="飞书机器人 Webhook">
              <input className="ba-input" value={str('push_feishu')} onChange={e => set('push_feishu', e.target.value)} placeholder="https://open.feishu.cn/..." />
            </Field>
          </div>
        )}
      </Section>

      {/* ── 完成后动作 ───────────────────────────────────────────────── */}
      <Section title="完成后动作" subtitle="所有调度任务完成后执行">
        <Field label="完成后">
          <select className="ba-select max-w-xs" value={str('then', '无动作')} onChange={e => set('then', e.target.value)}>
            <option value="无动作">无动作</option>
            <option value="退出 Baas">退出 Baas</option>
            <option value="退出 模拟器">退出 模拟器</option>
            <option value="退出 Baas 和 模拟器">退出 Baas 和 模拟器</option>
            <option value="关机">关机</option>
          </select>
        </Field>
      </Section>

      {/* ── 编队配置 ─────────────────────────────────────────────────── */}
      <Section title="编队配置" subtitle="关卡自动选队方式">
        <Field label="选队方式">
          <select className="ba-select max-w-xs" value={str('choose_team_method', 'order')} onChange={e => set('choose_team_method', e.target.value)}>
            <option value="order">按属性顺序</option>
            <option value="preset">使用预设编队</option>
          </select>
        </Field>
      </Section>

      {/* ── 启动选项 ─────────────────────────────────────────────────── */}
      <Section title="启动选项">
        <SwitchRow label="打开 BAAS 后立即开始执行调度" checked={bool('autostart')} onChange={v => set('autostart', v)} />
      </Section>

      {/* ── 配置导入 ─────────────────────────────────────────────────── */}
      <Section title="配置导入">
        <input ref={importRef} type="file" accept=".json" className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
              await onImport(file)
              setImportMsg(`✓ 已导入 ${file.name}`)
            } catch {
              setImportMsg('✗ 导入失败：文件格式不正确')
            }
            setTimeout(() => setImportMsg(null), 3000)
            e.target.value = ''
          }} />
        <div className="flex items-center gap-3">
          <button onClick={() => importRef.current?.click()}
            className="flex items-center gap-2 text-sm border border-ba-border rounded-lg px-4 py-2.5 hover:bg-ba-pale transition-all text-ba-navy">
            <Upload size={14} /> 导入配置文件
          </button>
          <p className="text-xs text-ba-muted">支持 config.json（设备配置）或 event.json（任务调度），自动识别</p>
        </div>
        {importMsg && (
          <p className={cn('text-xs', importMsg.startsWith('✓') ? 'text-ba-success' : 'text-ba-error')}>{importMsg}</p>
        )}
      </Section>
    </div>
  )
}

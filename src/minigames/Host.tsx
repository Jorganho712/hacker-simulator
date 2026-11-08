import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame, type MgResult } from '../game/store';
import { Chip, Icon, Modal } from '../components/ui';
import { MG_NAMES } from '../game/data/contracts';
import type { ChallengeDef, MgId } from '../game/types';
import Cipher from './Cipher';
import Logs from './Logs';
import Firewall from './Firewall';
import Investigation from './Investigation';
import Pattern from './Pattern';
import Auth from './Auth';
import Resources from './Resources';
import { audio } from '../game/audio';

export interface GameProps { ch: ChallengeDef; finish: (r: MgResult) => void }

const INSTR: Record<MgId, { icon: string; goal: string; how: string[]; win: string; lose: string }> = {
  cipher: { icon: 'KeyRound', goal: 'Decifrar mensagens, sequências e padrões.', how: ['César: ajuste o deslocamento até o texto fazer sentido.', 'Substituição: associe letras cifradas às letras reais usando frequência e contexto.', 'Vigenère: descubra a palavra-chave. Sequências e anagramas: digite a resposta.', 'Dicas gratuitas vêm da sua habilidade Criptografia e da ferramenta CryptLab.'], win: 'Resolva todas as etapas.', lose: '5 erros encerram o desafio.' },
  logs: { icon: 'ScrollText', goal: 'Encontrar a atividade suspeita escondida nos registros.', how: ['Clique nas linhas para marcá-las como suspeitas.', 'Use busca e filtros por serviço. Horários de madrugada e contas de serviço merecem atenção.', 'Ao final, informe o usuário e o IP suspeitos.', 'LogHunter e a habilidade Análise oferecem varreduras e dicas.'], win: 'Marque a maioria das linhas-chave com poucos falsos positivos e acerte usuário e IP.', lose: 'Falsos positivos demais ou respostas erradas.' },
  firewall: { icon: 'ShieldCheck', goal: 'Escrever regras que permitam tráfego legítimo e bloqueiem o hostil.', how: ['As regras são avaliadas de cima para baixo; vale a primeira que combina.', 'Defina também a política padrão (permitir ou negar).', 'Simule para ver um resumo; aplique para ser avaliado (consome tentativa).', 'PacketView revela a reputação das origens; FirewallX dá modelos de regra.'], win: 'Todo tráfego crítico permitido e pelo menos 90% do tráfego hostil bloqueado.', lose: 'Tentativas esgotadas.' },
  investigation: { icon: 'Search', goal: 'Descobrir o que aconteceu cruzando evidências.', how: ['Abra cada evidência e compare horários, nomes e origens.', 'Responda às perguntas. Cada resposta errada consome uma tentativa.', 'Forense destaca trechos-chave e TraceGuard concede tentativas extras.'], win: 'Responda corretamente todas as perguntas.', lose: 'Tentativas esgotadas.' },
  pattern: { icon: 'Shapes', goal: 'Identificar o próximo elemento de cada sequência.', how: ['Escolha uma das alternativas antes do tempo acabar.', 'A habilidade Análise estende o tempo de cada rodada.'], win: 'Acerte ao menos 65% das rodadas.', lose: 'Menos acertos que o necessário.' },
  auth: { icon: 'Fingerprint', goal: 'Descobrir a combinação secreta a partir das pistas.', how: ['Cada pista mostra um palpite antigo: quantos dígitos estão certos na posição certa e quantos estão certos na posição errada.', 'Todos os dígitos são diferentes. Deduza e teste combinações.', 'TraceGuard revela dígitos; Segurança dá tentativas extras.'], win: 'Descubra a combinação.', lose: 'Tentativas esgotadas.' },
  resources: { icon: 'Cpu', goal: 'Orquestrar processos dentro dos limites de CPU, RAM e tempo.', how: ['Inicie os processos respeitando dependências e a capacidade do seu computador.', 'Processos obrigatórios devem terminar antes do relógio zerar.', 'Hardware melhor = mais capacidade e processos mais rápidos.'], win: 'Conclua todos os processos obrigatórios a tempo.', lose: 'O tempo acabou.' },
};

export default function MinigameHost() {
  const mg = useGame((s) => s.mg)!;
  const finishMinigame = useGame((s) => s.finishMinigame);
  const [result, setResult] = useState<MgResult | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const ch = mg.ch;
  const ins = INSTR[ch.mg];

  const finish = (r: MgResult) => { audio.play(r.win ? 'success' : 'error'); setResult(r); };
  const gp: GameProps = { ch, finish };
  const Game = { cipher: Cipher, logs: Logs, firewall: Firewall, investigation: Investigation, pattern: Pattern, auth: Auth, resources: Resources }[ch.mg];

  return (
    <div className="fixed inset-0 z-[80] bg-void flex flex-col">
      <header className="shrink-0 border-b border-line bg-ink px-3 sm:px-5 py-2.5 flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-neon/10 border border-neon/40 grid place-items-center text-neon"><Icon name={ins.icon} size={18} /></div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm text-soft truncate">{ch.name}</div>
          <div className="text-[11px] text-mute font-mono">{MG_NAMES[ch.mg]} · dificuldade {'■'.repeat(ch.diff)}{'□'.repeat(5 - ch.diff)} · {ch.node}</div>
        </div>
        <button className="btn btn-ghost" onClick={() => setShowHelp(true)}><Icon name="CircleHelp" size={13} /><span className="hidden sm:inline">Instruções</span></button>
        {!result && <button className="btn btn-danger" onClick={() => setConfirmQuit(true)}><Icon name="LogOut" size={13} /><span className="hidden sm:inline">Desistir</span></button>}
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5">
        <div className="max-w-5xl mx-auto"><Game key={ch.id} {...gp} /></div>
      </div>

      <Modal open={showHelp && !result} onClose={() => setShowHelp(false)} title={<span>{MG_NAMES[ch.mg]} — instruções</span>} footer={<button className="btn" onClick={() => setShowHelp(false)}>Entendi, começar</button>}>
        <div className="space-y-3">
          <p className="text-sm text-soft"><b className="text-neon">Objetivo:</b> {ins.goal}</p>
          <ul className="space-y-1.5 text-sm text-soft/90">{ins.how.map((h) => <li key={h} className="flex gap-2"><span className="text-neon">▸</span>{h}</li>)}</ul>
          <div className="grid sm:grid-cols-2 gap-2 text-xs"><div className="panel p-2 border-neon/30"><b className="text-neon">Vitória:</b> {ins.win}</div><div className="panel p-2 border-alert/30"><b className="text-alert">Derrota:</b> {ins.lose}</div></div>
          <div className="flex gap-2 flex-wrap"><Chip tone="yellow">Recompensa base: {ch.contract ? 'via contrato' : `${ch.reward.money} cr`}</Chip><Chip tone="blue">{ch.reward.xp} XP</Chip></div>
        </div>
      </Modal>

      <Modal open={confirmQuit} onClose={() => setConfirmQuit(false)} title="Desistir do desafio?" footer={<><button className="btn btn-ghost" onClick={() => setConfirmQuit(false)}>Continuar</button><button className="btn btn-danger" onClick={() => { setConfirmQuit(false); finishMinigame({ win: false, score: 0, errors: 1, hints: 0 }); }}>Desistir</button></>}>
        <p className="text-sm text-soft/90">Você não recebe recompensa e o desafio conta como um erro na missão.</p>
      </Modal>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[90] bg-black/80 grid place-items-center p-4">
          <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} className={`panel !bg-ink max-w-md w-full p-6 text-center shadow-neon ${result.win ? '' : '!border-alert/50'}`}>
            <div className={`mx-auto w-16 h-16 rounded-full grid place-items-center mb-3 border-2 ${result.win ? 'border-neon text-neon bg-neon/10' : 'border-alert text-alert bg-alert/10'}`}><Icon name={result.win ? 'Check' : 'X'} size={32} /></div>
            <h2 className={`font-mono text-xl tracking-widest uppercase ${result.win ? 'text-neon glow' : 'text-alert'}`}>{result.win ? 'Desafio concluído' : 'Falha no desafio'}</h2>
            <p className="text-sm text-mute mt-1">{result.note || (result.win ? 'Excelente trabalho, operador.' : 'Analise o que deu errado e tente novamente.')}</p>
            <div className="grid grid-cols-3 gap-2 my-4 font-mono">
              <div className="panel py-2"><div className="text-lg text-warn">{result.score}</div><div className="text-[10px] text-mute uppercase">pontos</div></div>
              <div className="panel py-2"><div className="text-lg text-alert">{result.errors}</div><div className="text-[10px] text-mute uppercase">erros</div></div>
              <div className="panel py-2"><div className="text-lg text-tech">{result.hints}</div><div className="text-[10px] text-mute uppercase">dicas</div></div>
            </div>
            <button className="btn w-full" onClick={() => finishMinigame(result)}>Concluir e receber recompensa</button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

function toInt(v: string) {
  const n = Number(v.replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : null;
}

export default function NewContractPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [landlordName, setLandlordName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [leaseStart, setLeaseStart] = useState(""); // YYYY-MM-DD
  const [leaseEnd, setLeaseEnd] = useState("");
  const [deposit, setDeposit] = useState("");
  const [rent, setRent] = useState("");
  const [payday, setPayday] = useState(""); // 1~31
  const [specialTerms, setSpecialTerms] = useState("");

  async function submit() {
    // 필수 검증(최소)
    if (leaseStart > leaseEnd) return alert("계약 종료일은 시작일 이후여야 합니다");
    if (!title.trim()) return alert("계약명(제목)을 입력하세요");
    if (!address.trim()) return alert("주소를 입력하세요");
    if (!landlordName.trim()) return alert("임대인 성명을 입력하세요");
    if (!tenantName.trim()) return alert("임차인 성명을 입력하세요");
    if (!leaseStart) return alert("계약 시작일을 입력하세요");
    if (!leaseEnd) return alert("계약 종료일을 입력하세요");

    const depositNum = toInt(deposit);
    const rentNum = toInt(rent);
    const paydayNum = toInt(payday);

    if (depositNum === null) return alert("보증금은 숫자로 입력하세요");
    if (rentNum === null) return alert("월세는 숫자로 입력하세요 (전세면 0)");
    if (paydayNum === null || paydayNum < 1 || paydayNum > 31)
      return alert("월세 납부일(payday)은 1~31 숫자로 입력하세요");

    const { error } = await supabase.from("contracts").insert({
      title: title.trim(),
      address: address.trim(),
      landlord_name: landlordName.trim(),
      tenant_name: tenantName.trim(),
      lease_start: leaseStart,
      lease_end: leaseEnd,
      deposit: depositNum,
      rent: rentNum,
      payday: paydayNum,
      special_terms: specialTerms.trim() || null,
    });

    if (error) return alert(error.message);

    router.push("/contracts");
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>계약서(사건) 추가</h1>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <Field label="계약명(관리용)*">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 강남 오피스텔 임대차" />
        </Field>

        <Field label="주소*">
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="예: 서울시 강남구 ..." />
        </Field>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <Field label="임대인 성명*">
            <input value={landlordName} onChange={(e) => setLandlordName(e.target.value)} />
          </Field>
          <Field label="임차인 성명*">
            <input value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
          <Field label="계약 시작일*">
            <input type="date" value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)} />
          </Field>
          <Field label="계약 종료일*">
            <input type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr" }}>
          <Field label="보증금(원)*">
            <input value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="예: 10000000" />
          </Field>
          <Field label="월세(원)*">
            <input value={rent} onChange={(e) => setRent(e.target.value)} placeholder="전세면 0" />
          </Field>
          <Field label="월세 납부일(1~31)*">
            <input value={payday} onChange={(e) => setPayday(e.target.value)} placeholder="예: 25" />
          </Field>
        </div>

        <Field label="특약(선택)">
          <textarea
            value={specialTerms}
            onChange={(e) => setSpecialTerms(e.target.value)}
            placeholder="예: 반려동물 금지, 원상복구 범위 등"
            rows={4}
          />
        </Field>

        <button onClick={submit} style={{ padding: "12px 14px", marginTop: 6 }}>
          저장
        </button>

        <p style={{ opacity: 0.65, marginTop: 8 }}>
          ※ 사진 업로드/OCR은 다음 단계에서 “초안 제안” 방식으로 붙입니다(자동 저장 X).
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <div>{children}</div>
    </label>
  );
}

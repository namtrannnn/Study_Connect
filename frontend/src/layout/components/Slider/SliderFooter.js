export default function SliderFooter() {
    return (
        <div className="border-t border-border pt-4 mt-4 px-2">
            <div className="text-xs text-muted-foreground space-y-2">
                <div className="flex flex-wrap gap-2">
                    <a href="#" className="hover:underline">
                        Quyền riêng tư
                    </a>
                    <span>·</span>
                    <a href="#" className="hover:underline">
                        Điều khoản
                    </a>
                    <span>·</span>
                    <a href="#" className="hover:underline">
                        Quảng cáo
                    </a>
                </div>
                <div className="flex flex-wrap gap-2">
                    <a href="#" className="hover:underline">
                        Lựa chọn quảng cáo
                    </a>
                    <span>·</span>
                    <a href="#" className="hover:underline">
                        Cookie
                    </a>
                </div>
                <div className="mt-3">Social Network © 2024</div>
            </div>
        </div>
    );
}
